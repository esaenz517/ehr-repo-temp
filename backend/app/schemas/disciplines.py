"""
Disciplines Schemas
Request/response shapes for the disciplines API.
"""

from pydantic import BaseModel, Field


class DisciplineCreate(BaseModel):
    code: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=150)
    department_id: int | None = None


# Partial update; department_id can be cleared with null.
class DisciplineUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    department_id: int | None = None
    is_active: bool | None = None


class Discipline(BaseModel):
    discipline_id: int
    code: str
    name: str
    department_id: int | None = None
    is_active: bool

    class Config:
        from_attributes = True
