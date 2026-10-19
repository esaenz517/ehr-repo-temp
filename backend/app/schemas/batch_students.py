"""
Batch Students Schemas
Request and response shapes for CSV student batch creation.
"""

from pydantic import BaseModel, Field


class StudentBatchRequest(BaseModel):
    csv_text: str
    validate_only: bool = True


class StudentBatchRow(BaseModel):
    row_number: int
    email: str = ""
    name: str = ""
    status: str
    message: str
    staffid: int | None = None
    username: str | None = None
    temporary_password: str | None = None


class StudentBatchResult(BaseModel):
    validate_only: bool
    blocked: bool
    ready: int
    created: int
    existing: int
    invalid: int
    failed: int
    rows: list[StudentBatchRow]


class StudentSingleCreate(BaseModel):
    """
    Input for creating one student account.
    Uses the same fields accepted by the CSV importer.
    """

    first_name: str = Field(
        min_length=1,
        max_length=100,
    )

    middle_name: str | None = Field(
        default=None,
        max_length=100,
    )

    last_name: str = Field(
        min_length=1,
        max_length=100,
    )

    specialization: str = Field(
        min_length=1,
        max_length=100,
    )

    email: str = Field(
        min_length=3,
        max_length=320,
    )

    username: str | None = Field(
        default=None,
        max_length=254,
    )
