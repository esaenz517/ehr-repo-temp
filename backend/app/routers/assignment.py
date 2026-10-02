'''
Assignment Router
This file defines API endpoints for assigning cases to students: create assignments,
list them by student or by case, update their status, and delete them.
'''

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud import assignment as crud
from app.database import get_db
from app.schemas.assignment import AssignmentRequest, AssignmentStatus, Assignment

router = APIRouter(prefix="/assignments", tags=["assignments"])


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


@router.patch("/{assignment_id}/status", response_model = Assignment)
def update_status(assignment_id: int, body: AssignmentStatus, db: Session = Depends(get_db)):
    row = crud.update_status(db, assignment_id, body.encounter_status)
    if row is None:
        raise HTTPException(status_code = 404, detail = "Assignment not found")
    return row


@router.delete("/{assignment_id}", status_code = 204)
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    if not crud.delete_assignment(db, assignment_id):
        raise HTTPException(status_code = 404, detail = "Assignment not found")