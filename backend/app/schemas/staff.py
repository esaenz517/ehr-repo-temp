'''
Staff Schemas
Request/response shapes for the staff API - separate from the DB model (models.py)
because what a client sends/receives doesn't always match what's stored.

A staff row is a person: name, role (ADMIN, FACULTY_INSTRUCTOR, STUDENT),
discipline, and department.
'''

from pydantic import BaseModel, Field


# Shape of the data a client (frontend) sends to create a new person.
class StaffCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    role_id: int
    discipline_id: int | None = None
    department_id: int | None = None


# Partial update - only the fields the client sends are changed.
# The role is changed with PUT /staff/{staffid}/role/{role_id}, which needs
# the user.manage_roles permission.
class StaffUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    discipline_id: int | None = None
    department_id: int | None = None


# Shape of the data the API returns, with names next to the ids.
class Staff(BaseModel):
    staffid: int
    user_id: int | None = None
    first_name: str
    middle_name: str | None = None
    last_name: str
    role_id: int
    role_name: str | None = None
    discipline_id: int | None = None
    discipline_name: str | None = None
    department_id: int | None = None
    department_name: str | None = None
    # Shortcuts for the frontend: role_name == STUDENT / role_name == ADMIN
    student: bool = Field(default=False, validation_alias="is_student")
    admin: bool = Field(default=False, validation_alias="is_admin")

    class Config:
        from_attributes = True
