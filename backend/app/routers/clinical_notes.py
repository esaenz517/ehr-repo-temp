"""Clinical note drafts and version history. Authorization is enforced on each
record; each note type's fields and policy come from app/note_templates.py."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.crud import clinical_notes as crud
from app.crud import note_addenda as addenda_crud
from app.crud.assignment import is_locked
from app.crud.note_access_log import annotate, annotate_note
from app.models.disciplines import Discipline
from app.crud.patients import get_patient
from app.crud.staff import get_staff_for_user
from app.crud.rbac import (
    user_has_contextual_permission,
    user_has_permission,
)
from app.database import get_db
from app.models.clinical_notes import ClinicalNote, Encounter, NoteVersion
from app.models.providers import Provider
from app.models.note_addenda import NoteAddendum
from app.note_templates import (
    ContentError,
    NoteTemplate,
    ANY_DISCIPLINE,
    clean_content,
    get_template,
    may_author,
)
from app.schemas.note_addenda import NoteAddendumCreate, NoteAddendumOut
from app.schemas.clinical_notes import (
    ChartContext,
    EncounterOut,
    NoteCreate,
    NoteOut,
    NoteUpdate,
    VersionOut,
)
from app.security.current_user import get_current_user

router = APIRouter(tags=["clinical-notes"])

# Every request below is written to the note access log by
# app.security.note_access_middleware. Handlers call annotate()/annotate_note()
# before their permission checks, so refused attempts are logged with the note.

def can_access(
    db: Session,
    user,
    action: str,
    sensitivity: str,
    note_type: str = "SOAP",
) -> bool:
    """Role check for one note action (note.<action>.<sensitivity>); unknown
    types are refused. Restricted types also need may_open (by discipline)."""
    if get_template(note_type) is None:
        return False

    return user_has_contextual_permission(
        db,
        user.user_id,
        "note",
        action,
        sensitivity_level=sensitivity,
    )

def discipline_code(db: Session, user) -> str | None:
    """The signed-in person's discipline code (e.g. "PSYCHIATRY"), or None."""
    staff = get_staff_for_user(db, user.user_id)
    return staff.discipline.code if staff and staff.discipline else None


def restricted_access(db: Session, user, note: ClinicalNote) -> bool:
    """Mental health notes (templates with a restriction) are opened only by
    their author or, unless the type is author-only (psychotherapy notes), by
    people with the type's discipline. Role doesn't matter: an admin without
    the Psychiatry discipline is refused like anyone else. The assigning
    instructor reads them through GET /assignments/{id}/note instead."""
    template = get_template(note.note_type)

    if template is None:
        return False

    if template.restriction is None or note.author_user_id == user.user_id:
        return True

    if template.access == "author_only":
        return False

    return may_author(template, discipline_code(db, user))


def may_open(db: Session, user, action: str, note: ClinicalNote) -> bool:
    return can_access(
        db, user, action, note.sensitivity_classification, note.note_type
    ) and restricted_access(db, user, note)


def permitted_note(db: Session, user, action: str, note: ClinicalNote) -> None:
    """403 unless the user's role and (for mental health notes) discipline allow it."""
    if not may_open(db, user, action, note):
        raise HTTPException(
            status_code=403,
            detail="Insufficient note permission",
        )

def permitted(
    db: Session,
    user,
    action: str,
    sensitivity: str,
    note_type: str = "SOAP",
) -> None:
    if not can_access(db, user, action, sensitivity, note_type):
        raise HTTPException(
            status_code=403,
            detail="Insufficient note permission",
        )

def checked_content(template: NoteTemplate, content) -> dict:
    """The note's content checked against its template (422 when it doesn't fit)."""
    try:
        return clean_content(template, content)
    except ContentError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


# The author's discipline name (e.g. "Nursing") from their person row, or None.
def author_discipline(db: Session, user_id: int) -> str | None:
    staff = get_staff_for_user(db, user_id)
    return staff.discipline_name if staff else None

def check_author_discipline(db: Session, user, template: NoteTemplate) -> None:
    """Some types are written only by certain disciplines (the Staff tab's list):
    nursing shift notes by Nursing, PT assessments by Physical Therapy, mental
    health notes by Psychiatry, and progress notes and discharge summaries by
    anyone with a discipline (not "No discipline")."""
    staff = get_staff_for_user(db, user.user_id)
    code = staff.discipline.code if staff and staff.discipline else None

    if may_author(template, code):
        return

    if ANY_DISCIPLINE in template.author_disciplines:
        who = "people with a discipline"
    else:
        names = [
            d.name
            for d in db.query(Discipline)
            .filter(Discipline.code.in_(template.author_disciplines))
            .order_by(Discipline.name)
        ]
        who = f"{' or '.join(names) or 'its discipline'} staff and students"

    raise HTTPException(
        status_code=403,
        detail=f"A {template.label} can only be written by {who}",
    )

def patient_or_404(db: Session, patient_id: int):
    patient = get_patient(db, patient_id)

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )

    return patient


def note_or_404(
    db: Session,
    note_id: int,
    *,
    include_archived: bool = False,
) -> ClinicalNote:
    query = db.query(ClinicalNote).filter_by(note_id=note_id)

    if not include_archived:
        query = query.filter_by(is_archived=False)

    note = query.first()

    if note is None:
        raise HTTPException(
            status_code=404,
            detail="Note not found",
        )

    return note


@router.get(
    "/patients/{patient_id}/chart-context",
    response_model=ChartContext,
)
def chart_context(
    patient_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if not user_has_permission(
        db,
        user.user_id,
        "patient",
        "read",
    ):
        raise HTTPException(
            status_code=403,
            detail="Patient read permission required",
        )

    permitted(db, user, "read", "general")
    patient_or_404(db, patient_id)

    return crud.get_chart_context(db, patient_id)


@router.get(
    "/patients/{patient_id}/encounters",
    response_model=list[EncounterOut],
)
def list_encounters(
    patient_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if not user_has_permission(
        db,
        user.user_id,
        "patient",
        "read",
    ):
        raise HTTPException(
            status_code=403,
            detail="Patient read permission required",
        )

    permitted(db, user, "read", "general")
    patient_or_404(db, patient_id)

    return (
        db.query(Encounter)
        .filter_by(patient_id=patient_id)
        .order_by(Encounter.started_at.desc())
        .all()
    )


@router.post(
    "/patients/{patient_id}/encounters",
    response_model=EncounterOut,
    status_code=201,
)
def start_encounter(
    patient_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    permitted(db, user, "create", "general")
    patient_or_404(db, patient_id)

    encounter = Encounter(
        patient_id=patient_id,
        started_at=datetime.now(timezone.utc).replace(tzinfo=None),
    )

    db.add(encounter)
    db.commit()
    db.refresh(encounter)

    return encounter


@router.get(
    "/patients/{patient_id}/clinical-notes",
    response_model=list[NoteOut],
)
def list_notes(
    request: Request,
    patient_id: int,
    include_archived: bool = False,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    patient_or_404(db, patient_id)

    query = db.query(ClinicalNote).filter_by(patient_id=patient_id)

    if not include_archived:
        query = query.filter_by(is_archived=False)

    notes = query.order_by(ClinicalNote.created_at.desc()).all()
    shown = [n for n in notes if may_open(db, user, "read", n)]

    # The list returns each note's content, so the log names every note shown
    ids = ", ".join(str(n.note_id) for n in shown)
    annotate(
        request,
        patient_id=patient_id,
        details=(
            f"Returned {len(shown)} note(s)"
            + (f": {ids}" if ids else "")
            + (f"; {len(notes) - len(shown)} withheld by access rules" if len(notes) > len(shown) else "")
        ),
    )

    return [crud.note_data(n) for n in shown]


@router.post(
    "/clinical-notes",
    response_model=NoteOut,
    status_code=201,
)
def create_note(
    request: Request,
    payload: NoteCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    annotate(request, patient_id=payload.patient_id, note_type=payload.note_type)

    permitted(
        db,
        user,
        "create",
        payload.sensitivity_classification,
        payload.note_type,
    )

    template = get_template(payload.note_type)

    if template is None or not template.enabled:
        raise HTTPException(
            status_code=422,
            detail=f"Note type {payload.note_type} is not available",
        )

    check_author_discipline(db, user, template)

    content = checked_content(template, payload.content)

    patient = patient_or_404(db, payload.patient_id)

    encounter = (
        db.query(Encounter)
        .filter_by(
            encounter_id=payload.encounter_id,
            patient_id=payload.patient_id,
        )
        .first()
    )

    if encounter is None:
        raise HTTPException(
            status_code=422,
            detail="Encounter does not belong to this patient",
        )

    if is_locked(db, encounter.encounter_id):
        raise HTTPException(
            status_code=409,
            detail="This assignment was submitted; its note can no longer change",
        )

    provider_id = payload.responsible_provider_id

    if (
        provider_id is not None
        and db.query(Provider).filter_by(provider_id=provider_id).first() is None
    ):
        raise HTTPException(
            status_code=422,
            detail="Provider not found",
        )

    if provider_id is None:
        provider_id = patient.provider_id

    note = crud.create_note(
        db,
        patient_id=payload.patient_id,
        encounter_id=payload.encounter_id,
        provider_id=provider_id,
        author_id=user.user_id,
        discipline=author_discipline(db, user.user_id),
        sensitivity=payload.sensitivity_classification,
        content=content,
        note_type = template.id,
    )

    annotate_note(request, note)

    return crud.note_data(note)


@router.get(
    "/clinical-notes/{note_id}",
    response_model=NoteOut,
)
def get_note(
    request: Request,
    note_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    note = note_or_404(
        db,
        note_id,
        include_archived=True,
    )

    annotate_note(request, note)
    permitted_note(db, user, "read", note)

    return crud.note_data(note)


@router.put(
    "/clinical-notes/{note_id}",
    response_model=NoteOut,
)
def save_note(
    request: Request,
    note_id: int,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    note = note_or_404(db, note_id)

    annotate_note(request, note)
    permitted_note(db, user, "update", note)

    if note.author_user_id != user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the author may edit this draft",
        )

    if note.approved_at is not None or is_locked(db, note.encounter_id):
        raise HTTPException(
            status_code=409,
            detail="This assignment was submitted; its note can no longer change",
        )
    
    template = get_template(note.note_type)

    if template is None:
        raise HTTPException(
            status_code=422,
            detail=f"Note type {note.note_type} is not available",
        )

    result = crud.update_note(
        db,
        note,
        expected_version=payload.expected_version,
        content=checked_content(template, payload.content),
        author_id=user.user_id,
        summary=payload.change_summary,
    )

    if result is None:
        raise HTTPException(
            status_code=409,
            detail="This note has changed; reload it before saving",
        )

    return crud.note_data(result)


@router.get(
    "/clinical-notes/{note_id}/versions",
    response_model=list[VersionOut],
)
def list_versions(
    request: Request,
    note_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    note = note_or_404(
        db,
        note_id,
        include_archived=True,
    )

    annotate_note(request, note)
    permitted_note(db, user, "read", note)

    versions = (
        db.query(NoteVersion)
        .filter_by(note_id=note_id)
        .order_by(NoteVersion.version_number.desc())
        .all()
    )

    return [crud.version_data(v) for v in versions]


@router.delete(
    "/clinical-notes/{note_id}",
    status_code=204,
)
def archive_note(
    request: Request,
    note_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    note = note_or_404(db, note_id)

    annotate_note(request, note)
    permitted_note(db, user, "archive", note)

    if note.author_user_id != user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the author may archive this draft",
        )

    if note.approved_at is not None or is_locked(db, note.encounter_id):
        raise HTTPException(
            status_code=409,
            detail="Submitted or approved clinical notes cannot be archived",
        )

    note.is_archived = True
    note.last_modified_at = datetime.now(timezone.utc).replace(tzinfo=None)

    db.commit()

@router.post(
    "/clinical-notes/{note_id}/addenda",
    response_model=NoteAddendumOut,
    status_code=201,
)
def create_note_addendum(
    request: Request,
    note_id: int,
    payload: NoteAddendumCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    note = note_or_404(db, note_id)

    annotate_note(request, note)
    permitted_note(db, user, "update", note)

    if note.author_user_id != user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the original author may add a correction",
        )

    if note.approved_at is None:
        raise HTTPException(
            status_code=409,
            detail="Corrections require instructor approval first",
        )

    try:
        addendum = addenda_crud.create_addendum(
            db,
            note_id=note.note_id,
            author_user_id=user.user_id,
            content=payload.content,
        )

        db.commit()
        db.refresh(addendum)
        return addendum

    except Exception:
        db.rollback()
        raise

@router.get(
    "/clinical-notes/{note_id}/addenda",
    response_model=list[NoteAddendumOut],
)
def list_note_addenda(
    request: Request,
    note_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    note = note_or_404(db, note_id)

    annotate_note(request, note)
    permitted_note(db, user, "read", note)

    return (
        db.query(NoteAddendum)
        .filter(NoteAddendum.note_id == note.note_id)
        .order_by(
            NoteAddendum.created_at,
            NoteAddendum.addendum_id,
        )
        .all()
    )