'''
Assignment Schemas
Request/response shapes for the assignment API - separate from the DB model (models/assignment.py)
because what a client sends/receives doesn't always match what's stored.
'''

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

EncounterStatus = Literal["not_started", "in_progress", "submitted", "signed"] # Encounter status options
AssingmentType = Literal["graded", "practice"] # Assignment types

# What front end sends to assign cases.
class AssignmentRequest(BaseModel):
    case_id: int
    course_id: int | None = None  # the course offering; its students must be enrolled
    due_date: datetime | None = None
    assignment_type: AssingmentType = "graded"
    assigned_to: list[int]
    assigned_by: int | None = None  # ignored: the signed-in instructor is used

# What is sent to change Assignment Status 
class AssignmentStatus(BaseModel): 
    encounter_status: EncounterStatus
    feedback: str | None = None

# What instructor sends to save feedback
class AssignmentFeedback(BaseModel):
    feedback: str

# What API returns for one assignment
class Assignment(BaseModel):
    assignment_id: int
    case_id: int
    encounter_status: EncounterStatus
    course_id: int | None = None
    course: str | None = None  # label, e.g. "NURS 3310"
    due_date: datetime | None
    assignment_type: AssingmentType
    assigned_to: int
    assigned_by: int
    encounter_id: int | None = None  # the encounter the student's SOAP note belongs to
    patient_name: str | None = None  # Last name, First name format
    chief_complaint: str | None = None 
    feedback: str | None = None # Instructor feedback
    feedback_updated_at: datetime | None = None # feedback change-logging

    class Config:
        from_attributes = True