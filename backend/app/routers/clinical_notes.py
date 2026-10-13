"""SOAP drafts and version history. Authorization is enforced on each record."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import clinical_notes as crud
from app.crud.assignment import is_locked
from app.crud.patients import get_patient
from app.crud.rbac import (
    user_has_contextual_permission,
    user_has_permission,
)
from app.database import get_db
from app.models.clinical_notes import ClinicalNote, Encounter, NoteVersion
from app.models.providers import Provider
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


def permitted(
    db: Session,
    user,
    action: str,
    sensitivity: str,
    note_type: str = "SOAP",
) -> None:
    restriction = "PSYCHIATRY" if note_type == "PSYCHIATRY" else None

    if not user_has_contextual_permission(
        db,
        user.user_id,
        "note",
        action,
        sensitivity_level=sensitivity,
        note_type_restriction=restriction,
    ):
        raise HTTPException(
            status_code=403,
            detail="Insufficient note permission",
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

    # Filter each note independently; patients are never
    # classified as psychiatry patients.
    return [
        crud.note_data(n)
        for n in notes
        if user_has_contextual_permission(
            db,
            user.user_id,
            "note",
            "read",
            sensitivity_level=n.sensitivity_classification,
            note_type_restriction=(
                "PSYCHIATRY" if n.note_type == "PSYCHIATRY" else None
            ),
        )
    ]


@router.post(
    "/clinical-notes",
    response_model=NoteOut,
    status_code=201,
)
def create_note(
    payload: NoteCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    permitted(
        db,
        user,
        "create",
        payload.sensitivity_classification,
        payload.note_type,
    )

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
        discipline=user.discipline,
        sensitivity=payload.sensitivity_classification,
        content=payload.content,
    )

    return crud.note_data(note)


@router.get(
    "/clinical-notes/{note_id}",
    response_model=NoteOut,
)
def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    note = note_or_404(
        db,
        note_id,
        include_archived=True,
    )

    permitted(
        db,
        user,
        "read",
        note.sensitivity_classification,
        note.note_type,
    )

    return crud.note_data(note)


@router.put(
    "/clinical-notes/{note_id}",
    response_model=NoteOut,
)
def save_note(
    note_id: int,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    note = note_or_404(db, note_id)

    permitted(
        db,
        user,
        "update",
        note.sensitivity_classification,
        note.note_type,
    )

    if note.author_user_id != user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the author may edit this draft",
        )

    if is_locked(db, note.encounter_id):
        raise HTTPException(
            status_code=409,
            detail="This assignment was submitted; its note can no longer change",
        )

    result = crud.update_note(
        db,
        note,
        expected_version=payload.expected_version,
        content=payload.content,
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
    note_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    note = note_or_404(
        db,
        note_id,
        include_archived=True,
    )

    permitted(
        db,
        user,
        "read",
        note.sensitivity_classification,
        note.note_type,
    )

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
    note_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    note = note_or_404(db, note_id)

    permitted(
        db,
        user,
        "archive",
        note.sensitivity_classification,
        note.note_type,
    )

    if note.author_user_id != user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the author may archive this draft",
        )

    note.is_archived = True
    note.last_modified_at = datetime.now(timezone.utc).replace(tzinfo=None)

    db.commit()
