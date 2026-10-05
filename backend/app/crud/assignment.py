'''
Assignment CRUD
DB access functions for assignments - create, list by case/student, update status, delete
'''

from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.assignment import Assignment as AssignmentModel
from app.models.clinical_notes import ClinicalNote, Encounter
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
            assignment_type = request.assignment_type,
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

# Lists each assignment an instructor handed out, so they can follow students' progress
def list_assigned_by(db: Session, staff_id: int):
    return (
        db.query(AssignmentModel).filter(AssignmentModel.assigned_by == staff_id)
        .order_by(AssignmentModel.due_date, AssignmentModel.assigned_to).all()
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

# Starts the case: gives the assignment its own encounter (once) and marks it in progress
def start_assignment(db: Session, row: AssignmentModel):
    if row.encounter_status in ("submitted", "signed"):
        return row  # already turned in: nothing to start
    if row.encounter_id is None:
        encounter = Encounter(
            patient_id = row.case.patient_id,
            started_at = datetime.now(timezone.utc).replace(tzinfo = None),
        )
        db.add(encounter)
        db.flush()
        row.encounter_id = encounter.encounter_id
    if row.encounter_status == "not_started":
        row.encounter_status = "in_progress"
    db.commit()
    db.refresh(row)
    return row

# The student's SOAP note for this assignment, or None if nothing is saved yet
def get_note(db: Session, row: AssignmentModel):
    if row.encounter_id is None:
        return None
    return (
        db.query(ClinicalNote)
        .filter_by(encounter_id = row.encounter_id, is_archived = False)
        .order_by(ClinicalNote.created_at)
        .first()
    )

# True when the encounter belongs to work that was turned in, so its note can't change
def is_locked(db: Session, encounter_id: int):
    return (
        db.query(AssignmentModel)
        .filter(
            AssignmentModel.encounter_id == encounter_id,
            AssignmentModel.encounter_status.in_(["submitted", "signed"]),
        )
        .first()
        is not None
    )
