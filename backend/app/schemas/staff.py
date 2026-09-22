'''
Staff Schemas
Request/response shapes for the staff API - separate from the DB model (models.py)
because what a client sends/receives doesn't always match what's stored.
'''

from pydantic import BaseModel


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


# Shape of the data the API returns (adds fields the DB fills in).
class Staff(StaffBase):
    staffid: int

    class Config:
        from_attributes = True
