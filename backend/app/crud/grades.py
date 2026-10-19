"""
Grades CRUD
Stores rubric scores and publishes final grades.
"""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.grades import (
    AssignmentGrade,
    AssignmentGradeItem,
)

from app.schemas.grades import GradeSave


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_grade(db: Session, assignment_id: int):
    return db.query(AssignmentGrade).filter_by(assignment_id=assignment_id).first()


def save_grade(
    db: Session,
    assignment_id: int,
    staff_id: int,
    body: GradeSave,
):
    grade = get_grade(db, assignment_id)

    if grade is None:
        grade = AssignmentGrade(
            assignment_id=assignment_id,
            graded_by_staff_id=staff_id,
        )

        db.add(grade)
        db.flush()

    grade.graded_by_staff_id = staff_id
    grade.adjustment_points = body.adjustment_points

    grade.adjustment_reason = (body.adjustment_reason or "").strip() or None

    grade.updated_at = utc_now()

    # Editing a published grade returns it to draft status.
    grade.published_at = None

    grade.items.clear()
    db.flush()

    for index, item in enumerate(body.items):
        grade.items.append(
            AssignmentGradeItem(
                criterion_key=item.criterion_key.strip(),
                label=item.label.strip(),
                possible_points=item.possible_points,
                earned_points=item.earned_points,
                comment=(item.comment or "").strip() or None,
                sort_order=index,
            )
        )

    db.commit()
    db.refresh(grade)

    return grade


def publish_grade(
    db: Session,
    grade: AssignmentGrade,
):
    grade.published_at = utc_now()

    db.commit()
    db.refresh(grade)

    return grade


def grade_data(assignment, grade):
    possible = sum(
        (item.possible_points for item in grade.items),
        Decimal("0"),
    )

    earned = sum(
        (item.earned_points for item in grade.items),
        Decimal("0"),
    )

    final = earned + grade.adjustment_points

    return dict(
        assignment_id=assignment.assignment_id,
        case_id=assignment.case_id,
        course=assignment.course,
        assignment_type=assignment.assignment_type,
        items=[
            dict(
                criterion_key=item.criterion_key,
                label=item.label,
                possible_points=float(item.possible_points),
                earned_points=float(item.earned_points),
                comment=item.comment,
            )
            for item in grade.items
        ],
        earned_points=float(earned),
        possible_points=float(possible),
        adjustment_points=float(grade.adjustment_points),
        adjustment_reason=grade.adjustment_reason,
        final_points=float(final),
        percentage=(round(float(final / possible * 100), 2) if possible else 0),
        updated_at=grade.updated_at,
        published_at=grade.published_at,
    )
