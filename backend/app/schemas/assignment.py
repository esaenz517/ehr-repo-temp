'''
Assignment Schemas
Request/response shapes for the assignment API - separate from the DB model (models/assignment.py)
because what a client sends/receives doesn't always match what's stored.
'''

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

EncounterStatus = Literal["not_started", "in_progress", "submitted", "signed"] # Encounter status options

# What front end sends to assign cases.
class AssignmentRequest(BaseModel):
    case_id: int
    course: str | None = None
    due_date: datetime | None = None
    assigned_to: list[int]
    assigned_by: int # WILL NEED REFACTORING to draw from active session rather than manual input (not sure how to do this yet)

# What is sent to change Assignment Status 
class AssignmentStatus(BaseModel): 
    encounter_status: EncounterStatus

# What API returns for one assignment
class Assignment(BaseModel):
    assignment_id: int
    case_id: int
    encounter_status: EncounterStatus
    course: str | None
    due_date: datetime | None
    assigned_to: int
    assigned_by: int

    class Config:
        from_attributes = True