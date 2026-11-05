'''
Assignment CRUD
DB access functions for assignments - create, list by case/student, update status, delete
'''

from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.assignment import Assignment as AssignmentModel
from app.models.course_enrollments import CourseEnrollment
from app.models.courses import Course
from app.models.staff import Staff
from app.models.clinical_notes import ClinicalNote, Encounter
from app.models.rubric import AssignmentRubricScore
from app.schemas.assignment import AssignmentRequest, EncounterStatus

# Used to get assignments by parts that need it
def get_assignment(db: Session, assignment_id: int):
    return db.query(AssignmentModel).filter(AssignmentModel.assignment_id == assignment_id).first()

# Returns a reason the request can't be assigned, or None when it is fine:
# every assignee must be a student, and with a course they must be enrolled in it.
def check_assignees(db: Session, request: AssignmentRequest) -> str | None:
    student_ids = set(request.assigned_to)
    if not student_ids:
        return "Choose at least one student"

    people = db.query(Staff).filter(Staff.staffid.in_(student_ids)).all()
    if len(people) != len(student_ids):
        return "A student in your request does not exist"
    if any(not person.is_student for person in people):
        return "Cases can only be assigned to students"

    if request.course_id is not None:
        course = db.get(Course, request.course_id)
        if course is None or not course.is_active:
            return "Course not found or not active"

        enrolled = {
            staff_id
            for (staff_id,) in db.query(CourseEnrollment.staff_id).filter(
                CourseEnrollment.course_id == request.course_id,
                CourseEnrollment.staff_id.in_(student_ids),
            )
        }
        if enrolled != student_ids:
            return "Every student must be enrolled in the chosen course"

    return None

# Assigns one row per student (still able to batch assign)
def create_assignment(db: Session, request: AssignmentRequest, assigned_by: int):
    student_ids = list(dict.fromkeys(request.assigned_to))
    rows = [
        AssignmentModel(
            case_id = request.case_id,
            course_id = request.course_id,
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
def update_status(
    db: Session,
    assignment_id: int,
    status: EncounterStatus,
    feedback: str | None = None,
    *,
    commit: bool = True,
):

    row = get_assignment(db, assignment_id)

    if row is None:
        return None

    row.encounter_status = status

    if feedback is not None:
        set_feedback(row, feedback)

    if commit:
        db.commit()
        db.refresh(row)
    else:
        db.flush()

    return row

# Deletes assignments
def delete_assignment(db: Session, assignment_id: int):
    row = get_assignment(db, assignment_id)
    if row is None:
        return False
    db.query(AssignmentRubricScore).filter(AssignmentRubricScore.assignment_id == assignment_id).delete()
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

# Sets instructor feedback on assignment
def set_feedback(row: AssignmentModel, feedback: str):
    row.feedback = feedback.strip() or None
    row.feedback_updated_at = datetime.now(timezone.utc).replace(tzinfo = None)

# Saves instructor feedback on assignment (doesn't change status)
def save_feedback(db: Session, row: AssignmentModel, feedback: str):
    set_feedback(row, feedback)
    db.commit()
    db.refresh(row)
    return row