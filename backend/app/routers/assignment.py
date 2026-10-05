'''
Assignment Router
This file defines API endpoints for assigning cases to students: create assignments,
list them by student or by case, update their status, and delete them.
Students start, write their SOAP note in, and submit their own assignments.
'''

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud import assignment as crud
from app.crud.clinical_notes import note_data
from app.database import get_db
from app.models.login import Login
from app.schemas.assignment import AssignmentRequest, AssignmentStatus, Assignment
from app.schemas.clinical_notes import NoteOut
from app.security.current_user import get_current_login

router = APIRouter(prefix="/assignments", tags=["assignments"])


# Loads an assignment and checks the signed-in staff member is allowed to act on it
def assignment_for(db: Session, assignment_id: int, login: Login, *, student = False, instructor = False):
    row = crud.get_assignment(db, assignment_id)
    if row is None:
        raise HTTPException(status_code = 404, detail = "Assignment not found")
    allowed = (student and row.assigned_to == login.staffid) or (instructor and row.assigned_by == login.staffid)
    if not allowed:
        raise HTTPException(status_code = 403, detail = "This is not your assignment")
    return row


@router.post("", response_model = list[Assignment], status_code = 201)
def create_assignment(request: AssignmentRequest, db: Session = Depends(get_db)):
    try:
        return crud.create_assignment(db, request, assigned_by = request.assigned_by)
    except IntegrityError:
        raise HTTPException(status_code = 400, detail = "A case or staff ID in your request does not exist")


@router.get("/student/{student_id}", response_model = list[Assignment])
def list_for_student(student_id: int, db: Session = Depends(get_db)):
    return crud.list_for_student(db, student_id)


@router.get("/assigned-by/{staff_id}", response_model = list[Assignment])
def list_assigned_by(staff_id: int, db: Session = Depends(get_db)):
    return crud.list_assigned_by(db, staff_id)


@router.get("/case/{case_id}", response_model = list[Assignment])
def list_for_case(case_id: int, db: Session = Depends(get_db)):
    return crud.list_for_case(db, case_id)


# Student: open the case. Creates the assignment's encounter the first time.
@router.post("/{assignment_id}/start", response_model = Assignment)
def start_assignment(assignment_id: int, db: Session = Depends(get_db), login: Login = Depends(get_current_login)):
    row = assignment_for(db, assignment_id, login, student = True)
    return crud.start_assignment(db, row)


# Student or instructor: the SOAP note written for this assignment (null until the first save)
@router.get("/{assignment_id}/note", response_model = NoteOut | None)
def get_note(assignment_id: int, db: Session = Depends(get_db), login: Login = Depends(get_current_login)):
    row = assignment_for(db, assignment_id, login, student = True, instructor = True)
    note = crud.get_note(db, row)
    return note_data(note) if note else None


# Student: turn the case in. Needs a saved note; the note is locked afterwards.
@router.post("/{assignment_id}/submit", response_model = Assignment)
def submit_assignment(assignment_id: int, db: Session = Depends(get_db), login: Login = Depends(get_current_login)):
    row = assignment_for(db, assignment_id, login, student = True)
    if row.encounter_status != "in_progress":
        raise HTTPException(status_code = 409, detail = "Only an in-progress assignment can be submitted")
    if crud.get_note(db, row) is None:
        raise HTTPException(status_code = 409, detail = "Save a SOAP note before submitting")
    return crud.update_status(db, assignment_id, "submitted")


# Instructor: sign off on submitted work, or send it back ("in_progress") for re-work
@router.patch("/{assignment_id}/status", response_model = Assignment)
def update_status(assignment_id: int, body: AssignmentStatus, db: Session = Depends(get_db), login: Login = Depends(get_current_login)):
    assignment_for(db, assignment_id, login, instructor = True)
    return crud.update_status(db, assignment_id, body.encounter_status)


@router.delete("/{assignment_id}", status_code = 204)
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    if not crud.delete_assignment(db, assignment_id):
        raise HTTPException(status_code = 404, detail = "Assignment not found")