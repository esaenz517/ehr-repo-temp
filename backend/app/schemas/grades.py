"""
Grades Schemas
Request and response structures for grading and progress.
"""

from datetime import datetime
from decimal import Decimal

from pydantic import (
    BaseModel,
    Field,
    field_validator,
    model_validator,
)


class GradeCriterionInput(BaseModel):
    criterion_key: str = Field(
        min_length=1,
        max_length=80,
    )

    label: str = Field(
        min_length=1,
        max_length=200,
    )

    possible_points: Decimal = Field(
        gt=0,
        max_digits=9,
        decimal_places=2,
    )

    earned_points: Decimal = Field(
        ge=0,
        max_digits=9,
        decimal_places=2,
    )

    comment: str | None = Field(
        default=None,
        max_length=500,
    )

    @field_validator("criterion_key", "label")
    @classmethod
    def nonempty_text(cls, value: str):
        if not value.strip():
            raise ValueError("Criterion key and label cannot be blank")
        return value.strip()

    @model_validator(mode="after")
    def check_points(self):
        if self.earned_points > self.possible_points:
            raise ValueError("Earned points must not exceed possible points")
        return self


class GradeSave(BaseModel):
    items: list[GradeCriterionInput] = Field(
        min_length=1,
        max_length=100,
    )

    adjustment_points: Decimal = Field(
        default=Decimal("0"),
        max_digits=9,
        decimal_places=2,
    )

    adjustment_reason: str | None = Field(
        default=None,
        max_length=500,
    )

    @model_validator(mode="after")
    def check_grade(self):
        keys = [item.criterion_key for item in self.items]

        if len(keys) != len(set(keys)):
            raise ValueError("Each rubric criterion must have a unique key")

        if self.adjustment_points and not (self.adjustment_reason or "").strip():
            raise ValueError("Explain nonzero grading adjustments")

        raw = sum(
            (item.earned_points for item in self.items),
            Decimal("0"),
        )

        if raw + self.adjustment_points < 0:
            raise ValueError("Adjusted total cannot be negative")

        return self


class GradeCriterionOut(BaseModel):
    criterion_key: str
    label: str
    possible_points: float
    earned_points: float
    comment: str | None


class GradeOut(BaseModel):
    assignment_id: int
    case_id: int
    course: str | None
    assignment_type: str

    items: list[GradeCriterionOut]

    earned_points: float
    possible_points: float

    adjustment_points: float
    adjustment_reason: str | None

    final_points: float
    percentage: float

    updated_at: datetime
    published_at: datetime | None


class ProgressItem(BaseModel):
    assignment_id: int
    case_id: int
    course: str | None

    assigned_to: int
    student_name: str

    encounter_status: str

    assigned_at: datetime
    due_date: datetime | None
    last_saved_at: datetime | None

    idle_hours: float
    alert: str | None
    inactivity_threshold_hours: float | None


class ProgressReport(BaseModel):
    total: int
    not_started: int
    in_progress: int
    submitted: int
    signed: int

    inactive: int
    overdue: int

    assignments: list[ProgressItem]
