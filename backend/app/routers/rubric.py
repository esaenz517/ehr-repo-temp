"""
Rubric Router
This file defines API endpoints for grading against a case's rubric.
The rubric is entered with the case (POST /cases, rubric_items)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import rubric as crud
from app.database import get_db
from app.models.login import Login
from app.routers.assignment import assignment_for
from app.schemas.rubric import AssignmentGrade, RubricScoresRequest
from app.security.authorization import require_permission
from app.security.current_user import get_current_login

router = APIRouter(prefix="/assignments", tags = ["rubric"])

# The assignment's rubric and score.
# Student sees nothing until the work is signed off.
@router.get("/{assignment_id}/grade", response_model = AssignmentGrade)
def get_grade(assignment_id: int, db: Session = Depends(get_db), current_user=Depends(require_permission("assignment", "read")), login: Login = Depends(get_current_login)):
    row = assignment_for(db, assignment_id, login, student = True, instructor = True)
    if row.assigned_by == login.staffid:
        return crud.grade(db, row, include_guidance = True)
    if row.encounter_status != "signed":
        return AssignmentGrade(assignment_id = row.assignment_id, released = False)
    return crud.grade(db, row, include_guidance = False)


# Instructor saves scores for rubric items while reviewing submitted or signed work.
@router.put("/{assignment_id}/rubric-scores", response_model = AssignmentGrade)
def save_scores(assignment_id: int, body: RubricScoresRequest, db: Session = Depends(get_db), current_user=Depends(require_permission("assignment", "update")), login: Login = Depends(get_current_login)):
    row = assignment_for(db, assignment_id, login, instructor = True)
    if row.encounter_status not in ("submitted", "signed"):
        raise HTTPException(status_code = 409, detail = "Rubric scores can only be entered on submitted work")
    error = crud.save_scores(db, row, body.scores)
    if error:
        raise HTTPException(status_code = 400, detail = error)
    return crud.grade(db, row, include_guidance = True)