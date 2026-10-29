'''
Staff Schemas
Request/response shapes for the staff API - separate from the DB model (models.py)
because what a client sends/receives doesn't always match what's stored.
'''

from pydantic import BaseModel, Field


# Fields shared by every Staff member.
class StaffBase(BaseModel):
    first_name: str
    middle_name: str | None = None
    last_name: str
    specialization: str
    student: bool = False
    admin: bool = False


# Shape of the data a client (frontend) sends to create a new staff member.
class StaffCreate(StaffBase):
    pass


# Partial update - only the fields the client sends are changed.
# The student flag isn't editable here; students go through the student workflow.
class StaffUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    specialization: str | None = Field(default=None, min_length=1, max_length=100)
    admin: bool | None = None


# Shape of the data the API returns (adds fields the DB fills in).
class Staff(StaffBase):
    staffid: int

    class Config:
        from_attributes = True
