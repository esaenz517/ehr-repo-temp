"""
Assignment Grades Models
SQLAlchemy models for assignment grades and rubric criteria.
"""

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UnicodeText,
)

from sqlalchemy.orm import relationship

from app.database import Base


class AssignmentGrade(Base):
    __tablename__ = "AssignmentGrades"
    __table_args__ = {"schema": "dbo"}

    assignment_id = Column(
        "AssignmentId",
        Integer,
        ForeignKey("dbo.Assignment.AssignmentId"),
        primary_key=True,
    )

    adjustment_points = Column(
        "AdjustmentPoints",
        Numeric(9, 2),
        nullable=False,
        default=0,
    )

    adjustment_reason = Column(
        "AdjustmentReason",
        UnicodeText,
    )

    graded_by_staff_id = Column(
        "GradedByStaffId",
        Integer,
        ForeignKey("dbo.Staff.StaffId"),
        nullable=False,
    )

    updated_at = Column(
        "UpdatedAt",
        DateTime,
        nullable=False,
    )

    published_at = Column(
        "PublishedAt",
        DateTime,
    )

    items = relationship(
        "AssignmentGradeItem",
        cascade="all, delete-orphan",
        order_by="AssignmentGradeItem.sort_order",
    )


class AssignmentGradeItem(Base):
    __tablename__ = "AssignmentGradeItems"
    __table_args__ = {"schema": "dbo"}

    grade_item_id = Column(
        "GradeItemId",
        Integer,
        primary_key=True,
    )

    assignment_id = Column(
        "AssignmentId",
        Integer,
        ForeignKey("dbo.AssignmentGrades.AssignmentId"),
        nullable=False,
    )

    criterion_key = Column(
        "CriterionKey",
        String(80),
        nullable=False,
    )

    label = Column(
        "Label",
        String(200),
        nullable=False,
    )

    possible_points = Column(
        "PossiblePoints",
        Numeric(9, 2),
        nullable=False,
    )

    earned_points = Column(
        "EarnedPoints",
        Numeric(9, 2),
        nullable=False,
    )

    comment = Column(
        "Comment",
        String(500),
    )

    sort_order = Column(
        "SortOrder",
        Integer,
        nullable=False,
    )
