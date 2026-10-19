'''
Rubric Schemas
Request/response shapes for the case rubrics and assignment rubric scores
'''

from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints

RubricCategory = Literal["diagnosis", "medication_conflict", "screening", "trap", "other"]

# One rubric item sent with a new case
class RubricItemCreate(BaseModel):
    category: RubricCategory = "other"
    label: Annotated[str, StringConstraints(strip_whitespace = True, min_length = 1, max_length = 300)]
    points: int = Field(gt = 0)
    guidance: str | None = Field(default = None, max_length = 1000)

# One score the instructor sends when reviewing
class RubricScoreInput(BaseModel):
    rubric_item_id: int
    points_awarded: int = Field(ge = 0)
    comment: str | None = Field(default = None, max_length = 1000)

class RubricScoresRequest(BaseModel):
    scores: list[RubricScoreInput]

# One rubric line in a grade. Includes the item and points earned on it.
class GradeItem(BaseModel):
    rubric_item_id: int
    category: RubricCategory
    label: str
    points: int
    guidance: str | None = None # instructor only
    points_awarded: int | None = None
    comment: str | None = None

# Assignment's rubric and score
class AssignmentGrade(BaseModel):
    assignment_id: int
    released: bool
    items: list[GradeItem] = []
    total_points: int | None = None
    points_awarded: int | None = None
    scored_count: int | None = None