"""Student-visible published grades and instructor-owned grading/progress reports."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import false, func
from sqlalchemy.orm import Session

from app.crud import grades as grades_crud
from app.crud.progress import progress_alert
from app.database import get_db
from app.models.assignment import Assignment
from app.models.clinical_notes import ClinicalNote
from app.models.grades import AssignmentGrade
from app.models.login import Login
from app.models.staff import Staff
from app.schemas.grades import (
    GradeOut,
    GradeSave,
    ProgressItem,
    ProgressReport,
)
from app.security.authorization import require_permission
from app.security.current_user import get_current_login

router = APIRouter(
    prefix="/grades",
    tags=["grades-progress"],
)


def instructor_assignment(
    db: Session,
    assignment_id: int,
    login: Login,
):
    row = db.query(Assignment).filter_by(assignment_id=assignment_id).first()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )

    if row.assigned_by != login.staffid:
        raise HTTPException(
            status_code=403,
            detail="Only the assigning instructor may grade",
        )

    return row


@router.get("/student", response_model=list[GradeOut])
def student_grades(
    db: Session = Depends(get_db),
    user=Depends(require_permission("assignment", "read")),
    login: Login = Depends(get_current_login),
):
    # The signed-in account determines which grades are returned.
    rows = (
        db.query(Assignment, AssignmentGrade)
        .join(
            AssignmentGrade,
            AssignmentGrade.assignment_id == Assignment.assignment_id,
        )
        .filter(
            Assignment.assigned_to == login.staffid,
            Assignment.encounter_status == "signed",
            AssignmentGrade.published_at.isnot(None),
        )
        .order_by(AssignmentGrade.published_at.desc())
        .all()
    )

    return [grades_crud.grade_data(assignment, grade) for assignment, grade in rows]


@router.get("/instructor", response_model=list[GradeOut])
def instructor_grades(
    db: Session = Depends(get_db),
    user=Depends(require_permission("assignment", "read")),
    login: Login = Depends(get_current_login),
):
    rows = (
        db.query(Assignment, AssignmentGrade)
        .join(
            AssignmentGrade,
            AssignmentGrade.assignment_id == Assignment.assignment_id,
        )
        .filter(Assignment.assigned_by == login.staffid)
        .order_by(AssignmentGrade.updated_at.desc())
        .all()
    )

    return [grades_crud.grade_data(assignment, grade) for assignment, grade in rows]


@router.get(
    "/instructor/progress",
    response_model=ProgressReport,
)
def instructor_progress(
    db: Session = Depends(get_db),
    user=Depends(require_permission("assignment", "read")),
    login: Login = Depends(get_current_login),
):
    rows = (
        db.query(Assignment, Staff)
        .join(
            Staff,
            Staff.staffid == Assignment.assigned_to,
        )
        .filter(Assignment.assigned_by == login.staffid)
        .order_by(
            Assignment.due_date,
            Assignment.assigned_to,
        )
        .all()
    )

    encounter_ids = [
        assignment.encounter_id
        for assignment, _ in rows
        if assignment.encounter_id is not None
    ]

    saved = {}

    if encounter_ids:
        saved = dict(
            db.query(
                ClinicalNote.encounter_id,
                func.max(ClinicalNote.last_modified_at),
            )
            .filter(
                ClinicalNote.encounter_id.in_(encounter_ids),
                ClinicalNote.is_archived == false(),
            )
            .group_by(ClinicalNote.encounter_id)
            .all()
        )

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    items = []

    for assignment, student in rows:
        last_saved = saved.get(assignment.encounter_id)

        alert, idle_hours, threshold = progress_alert(
            assignment.assigned_at,
            assignment.due_date,
            last_saved,
            assignment.encounter_status,
            now,
        )

        items.append(
            ProgressItem(
                assignment_id=assignment.assignment_id,
                case_id=assignment.case_id,
                course=assignment.course,
                assigned_to=assignment.assigned_to,
                student_name=(f"{student.last_name}, {student.first_name}"),
                encounter_status=assignment.encounter_status,
                assigned_at=assignment.assigned_at,
                due_date=assignment.due_date,
                last_saved_at=last_saved,
                idle_hours=idle_hours,
                alert=alert,
                inactivity_threshold_hours=threshold,
            )
        )

    return ProgressReport(
        total=len(items),
        not_started=sum(item.encounter_status == "not_started" for item in items),
        in_progress=sum(item.encounter_status == "in_progress" for item in items),
        submitted=sum(item.encounter_status == "submitted" for item in items),
        signed=sum(item.encounter_status == "signed" for item in items),
        inactive=sum(item.alert == "inactive" for item in items),
        overdue=sum(item.alert == "overdue" for item in items),
        assignments=items,
    )


@router.get(
    "/assignments/{assignment_id}",
    response_model=GradeOut | None,
)
def instructor_grade(
    assignment_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_permission("assignment", "read")),
    login: Login = Depends(get_current_login),
):
    row = instructor_assignment(
        db,
        assignment_id,
        login,
    )

    grade = grades_crud.get_grade(
        db,
        assignment_id,
    )

    return grades_crud.grade_data(row, grade) if grade else None


@router.put(
    "/assignments/{assignment_id}",
    response_model=GradeOut,
)
def save_grade(
    assignment_id: int,
    body: GradeSave,
    db: Session = Depends(get_db),
    user=Depends(require_permission("assignment", "update")),
    login: Login = Depends(get_current_login),
):
    row = instructor_assignment(
        db,
        assignment_id,
        login,
    )

    if row.encounter_status not in (
        "submitted",
        "signed",
    ):
        raise HTTPException(
            status_code=409,
            detail="Submit the assignment before grading",
        )

    grade = grades_crud.save_grade(
        db,
        assignment_id,
        login.staffid,
        body,
    )

    return grades_crud.grade_data(
        row,
        grade,
    )


@router.post(
    "/assignments/{assignment_id}/publish",
    response_model=GradeOut,
)
def publish_grade(
    assignment_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_permission("assignment", "update")),
    login: Login = Depends(get_current_login),
):
    row = instructor_assignment(
        db,
        assignment_id,
        login,
    )

    if row.encounter_status != "signed":
        raise HTTPException(
            status_code=409,
            detail="Sign off on the assignment before publishing",
        )

    grade = grades_crud.get_grade(
        db,
        assignment_id,
    )

    if grade is None or not grade.items:
        raise HTTPException(
            status_code=409,
            detail="Save the rubric score first",
        )

    grade = grades_crud.publish_grade(
        db,
        grade,
    )

    return grades_crud.grade_data(
        row,
        grade,
    )
