"""
Assignment Router
This file defines API endpoints for assigning cases to students: create assignments,
list them by student or by case, update their status, and delete them.
Students start, write their SOAP note in, and submit their own assignments.
Instructors write feedback on submitted work, then sign it off or send it back.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.security.authorization import require_permission
from app.crud import assignment as crud
from app.crud import rubric as rubric_crud
from app.crud.clinical_notes import note_data
from app.crud.note_access_log import annotate, annotate_note
from app.routers.clinical_notes import can_access
from app.note_templates import get_template, missing_required
from app.crud import grades as grades_crud
from app.database import get_db
from app.models.login import Login
from app.models.clinical_notes import ClinicalNote
from app.models.note_audit_events import NoteAuditEvent
from app.schemas.assignment import (
    AssignmentRequest,
    AssignmentStatus,
    Assignment,
    AssignmentFeedback,
)
from app.schemas.clinical_notes import NoteOut
from app.security.current_user import get_current_login

router = APIRouter(prefix="/assignments", tags=["assignments"])


# Loads an assignment and checks the signed-in staff member is allowed to act on it
def assignment_for(
    db: Session, assignment_id: int, login: Login, *, student=False, instructor=False
):
    row = crud.get_assignment(db, assignment_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Assignment not found")
    allowed = (student and row.assigned_to == login.staffid) or (
        instructor and row.assigned_by == login.staffid
    )
    if not allowed:
        raise HTTPException(status_code=403, detail="This is not your assignment")
    return row


# What student sees of their assignment; feedback stays hidden until work is submitted
def student_view(row):
    data = Assignment.model_validate(row)
    if row.encounter_status == "submitted":
        data = data.model_copy(update={"feedback": None, "feedback_updated_at": None})
    return data


@router.post(
    "",
    response_model=list[Assignment],
    status_code=201,
)
def create_assignment(
    request: AssignmentRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("assignment", "manage")),
    login: Login = Depends(get_current_login),
):
    if login.staffid is None:
        raise HTTPException(status_code=403, detail="Your account is not linked to a person")

    problem = crud.check_assignees(db, request)
    if problem:
        raise HTTPException(status_code=400, detail=problem)

    try:
        return crud.create_assignment(
            db,
            request,
            assigned_by=login.staffid,
        )

    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="A case or staff ID in your request does not exist",
        )


@router.get(
    "/student/{student_id}",
    response_model=list[Assignment],
)
def list_for_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("assignment", "read")),
    login: Login = Depends(get_current_login),
):
    if student_id != login.staffid:
        raise HTTPException(
            status_code=403,
            detail="Only your own assignments may be listed",
        )

    return [student_view(row) for row in crud.list_for_student(db, student_id)]


@router.get(
    "/assigned-by/{staff_id}",
    response_model=list[Assignment],
)
def list_assigned_by(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("assignment", "read")),
    login: Login = Depends(get_current_login),
):
    if staff_id != login.staffid:
        raise HTTPException(
            status_code=403,
            detail="Only your own assigned cases may be listed",
        )

    return crud.list_assigned_by(db, staff_id)


@router.get(
    "/case/{case_id}",
    response_model=list[Assignment],
)
def list_for_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("assignment", "read")),
    login: Login = Depends(get_current_login),
):
    rows = crud.list_for_case(db, case_id)

    visible = [
        row
        for row in rows
        if (row.assigned_to == login.staffid or row.assigned_by == login.staffid)
    ]

    return [
        (
            student_view(row)
            if row.assigned_to == login.staffid and row.assigned_by != login.staffid
            else row
        )
        for row in visible
    ]


# Student: open the case. Creates the assignment's encounter the first time.
@router.post("/{assignment_id}/start", response_model=Assignment)
def start_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("assignment", "update")),
    login: Login = Depends(get_current_login),
):
    row = assignment_for(db, assignment_id, login, student=True)
    return student_view(crud.start_assignment(db, row))


# Student or instructor: the note written for this assignment
# Returns null until the first save. The student and the assigning instructor
# may read it whatever its type (mental health notes included: the instructor
# reviews and grades it), but their role must still grant note reading.
@router.get("/{assignment_id}/note", response_model=NoteOut | None)
def get_note(
    request: Request,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("assignment", "read")),
    login: Login = Depends(get_current_login),
):
    row = assignment_for(
        db,
        assignment_id,
        login,
        student=True,
        instructor=True,
    )

    note = crud.get_note(db, row)
    if note is None:
        annotate(request, details=f"Assignment {assignment_id}: no note saved yet")
        return None

    annotate_note(request, note, details=f"Assignment {assignment_id}")
    if not can_access(db, current_user, "read", note.sensitivity_classification, note.note_type):
        raise HTTPException(status_code=403, detail="Insufficient note permission")

    return note_data(note)


# Student: turn the case in. Needs a saved note; the note is locked afterwards.
@router.post("/{assignment_id}/submit", response_model=Assignment)
def submit_assignment(
    request: Request,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("assignment", "update")),
    login: Login = Depends(get_current_login),
):
    row = assignment_for(db, assignment_id, login, student=True)
    if row.encounter_status != "in_progress":
        raise HTTPException(
            status_code=409,
            detail="Only an in-progress assignment can be submitted",
        )
    note = crud.get_note(db, row)
    if note is None:
        raise HTTPException(
            status_code=409,
            detail="Save your note before submitting",
        )
    annotate_note(request, note, details=f"Assignment {assignment_id}")

    # The note's template lists fields that must be complete before it's turned in
    template = get_template(note.note_type)
    if template is not None:
        missing = missing_required(template, note_data(note)["content"])
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Complete these fields before submitting: {', '.join(missing)}",
            )

    return student_view(crud.update_status(db, assignment_id, "submitted"))


# Instructor: save feedback on submitted work.
@router.put("/{assignment_id}/feedback", response_model=Assignment)
def save_feedback(
    assignment_id: int,
    body: AssignmentFeedback,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("assignment", "update")),
    login: Login = Depends(get_current_login),
):
    row = assignment_for(db, assignment_id, login, instructor=True)
    if row.encounter_status not in ("submitted", "signed"):
        raise HTTPException(
            status_code=409,
            detail="Feedback can only be written on submitted work",
        )
    return crud.save_feedback(db, row, body.feedback)


# Instructor: sign off on submitted work or send it back for rework.
# Approval records the instructor and timestamp with the status change.
# Students also hold assignment.update, so the instructor check prevents self sign-off.
@router.patch(
    "/{assignment_id}/status",
    response_model=Assignment,
)
def update_status(
    request: Request,
    assignment_id: int,
    body: AssignmentStatus,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("assignment", "update")),
    login: Login = Depends(get_current_login),
):
    row = assignment_for(
        db,
        assignment_id,
        login,
        instructor=True,
    )

    reviewed = crud.get_note(db, row)
    if reviewed is not None:
        annotate_note(
            request,
            reviewed,
            details=f"Assignment {assignment_id}: {'signed off' if body.encounter_status == 'signed' else 'sent back'}",
        )

    if body.encounter_status not in ("in_progress", "signed"):
        raise HTTPException(
            status_code=422,
            detail="Instructor must sign off or send back the assignment",
        )

    if row.encounter_status == "signed":
        raise HTTPException(
            status_code=409,
            detail="Approved assignments cannot be reopened or modified",
        )

    if row.encounter_status != "submitted":
        raise HTTPException(
            status_code=409,
            detail="Only submitted work can be reviewed",
        )

    # Require rubric completion before instructor approval.
    if body.encounter_status == "signed" and not rubric_crud.fully_scored(db, row):
        raise HTTPException(
            status_code=409,
            detail="Score every rubric item before signing off",
        )

    try:
        if body.encounter_status == "signed":
            note = crud.get_note(db, row)

            if note is None:
                raise HTTPException(
                    status_code=409,
                    detail="Cannot approve an assignment without a clinical note",
                )

            if note.approved_at is not None:
                raise HTTPException(
                    status_code=409,
                    detail="This clinical note has already been approved",
                )

            # Store approval metadata on the clinical note.
            now = datetime.now(timezone.utc).replace(tzinfo=None)

            note.approved_at = now
            note.approved_by_user_id = current_user.user_id

            # Record the instructor approval in the audit log.
            db.add(
                NoteAuditEvent(
                    note_id=note.note_id,
                    actor_user_id=current_user.user_id,
                    action="note_approved",
                    details="Instructor approved the clinical note",
                    created_at=now,
                )
            )

        else:
            # Returning work for rework also unpublishes its grade.
            grade = grades_crud.get_grade(db, assignment_id)

            if grade is not None and grade.published_at is not None:
                grade.published_at = None

        # Commit the status change and associated updates together.
        updated = crud.update_status(
            db,
            assignment_id,
            body.encounter_status,
            feedback=body.feedback,
            commit=False,
        )

        db.commit()
        db.refresh(updated)

        return updated

    except Exception:
        db.rollback()
        raise


@router.delete("/{assignment_id}", status_code=204)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("assignment", "manage")),
):
    if not crud.delete_assignment(db, assignment_id):
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )
