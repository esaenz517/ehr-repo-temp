"""
Departments Schemas
Request/response shapes for the departments API.
"""

from pydantic import BaseModel, Field


class DepartmentCreate(BaseModel):
    code: str = Field(min_length=1, max_length=10)
    name: str = Field(min_length=1, max_length=150)


# Partial update, e.g. {"is_active": false} to retire a department.
class DepartmentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    is_active: bool | None = None


class Department(BaseModel):
    department_id: int
    code: str
    name: str
    is_active: bool

    class Config:
        from_attributes = True
