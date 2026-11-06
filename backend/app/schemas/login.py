'''
Login Schemas
Request/response shapes for the login request API - separate from the DB model (models/login.py)
because what a client sends/receives doesn't always match what's stored.
'''

from pydantic import BaseModel

# What front end sends to log in.
class LoginRequest(BaseModel):
    username: str
    password: str


# Shape of the data the API returns: who signed in and what they may do.
class LoginResponse(BaseModel):
    username: str
    staffid: int | None = None
    # Set for a patient portal account (role is then PATIENT)
    patientid: int | None = None
    first_name: str | None = None
    last_name: str | None = None
    # ADMIN, FACULTY_INSTRUCTOR, or STUDENT; PATIENT for a portal account
    role: str | None = None
    role_display_name: str | None = None
    department_id: int | None = None
    department_code: str | None = None
    department_name: str | None = None
    discipline_id: int | None = None
    discipline_name: str | None = None
    # Permission codes of the role, e.g. "patient.read", "note.read.general"
    permissions: list[str] = []
    # Shortcuts kept for the frontend: role == STUDENT / role == ADMIN
    student: bool = False
    admin: bool = False

    class Config:
        from_attributes = True
