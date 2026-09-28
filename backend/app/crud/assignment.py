'''
Assignment CRUD
DB access functions for assignments - create, list by case/student, update status, delete
'''

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.assignment import Assignment as AssignmentModel
from app.schemas.assignment import AssignmentRequest, EncounterStatus

# Used to get assignments by parts that need it
def get_assignment(db: Session, assignment_id: int):
    return db.query(AssignmentModel).filter(AssignmentModel.assignment_id == assignment_id).first()

# Assigns one row per student (still able to batch assign)
def create_assignment(db: Session, request: AssignmentRequest, assigned_by: int):
    student_ids = list(dict.fromkeys(request.assigned_to))
    rows = [
        AssignmentModel(
            case_id = request.case_id,
            course = request.course,
            due_date = request.due_date,
            assigned_to = student_id,
            assigned_by = assigned_by
        )
        for student_id in student_ids
    ]
    db.add_all(rows)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    for row in rows:
        db.refresh(row)
    return rows

# Lists each assignment assigned to a student in order of due date
def list_for_student(db: Session, student_id: int):
    return (
        db.query(AssignmentModel).filter(AssignmentModel.assigned_to == student_id)
        .order_by(AssignmentModel.due_date).all()
    )

# Lists each student assigned to a case by student ID number (numerical ascending)
def list_for_case(db: Session, case_id: int):
    return (
        db.query(AssignmentModel).filter(AssignmentModel.case_id == case_id)
        .order_by(AssignmentModel.assigned_to).all()
    )

# Updates the status of an assignment
def update_status(db: Session, assignment_id: int, status: EncounterStatus):
    row = get_assignment(db, assignment_id)
    if row is None:
        return None
    row.encounter_status = status
    db.commit()
    db.refresh(row)
    return row

# Deletes assignments
def delete_assignment(db: Session, assignment_id: int):
    row = get_assignment(db, assignment_id)
    if row is None:
        return False
    db.delete(row)
    db.commit()
    return True