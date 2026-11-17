"""
Check-ins Schemas
Request/response shapes for the front desk API (/front-desk). Responses carry the
patient's name, MRN, and room number so the front desk board needs no extra lookups.
"""

from datetime import datetime

from pydantic import BaseModel


# Check a patient in: for one of today's appointments, or as a walk-in (no appointment)
class CheckInCreate(BaseModel):
    patient_id: int
    appointment_id: int | None = None


# Put a waiting patient in a room
class CheckInRoom(BaseModel):
    room_id: int


# One row of the queue
class CheckIn(BaseModel):
    check_in_id: int
    patient_id: int
    patient_name: str
    mrn: str | None = None
    appointment_id: int | None = None
    appointment_time: datetime | None = None
    location: str | None = None
    room_id: int | None = None
    room_number: int | None = None
    status: str  # waiting, roomed, done, or cancelled
    checked_in_at: datetime | None = None
    roomed_at: datetime | None = None
    checked_out_at: datetime | None = None


# A scheduled appointment on the chosen day that hasn't been checked in yet
class DeskAppointment(BaseModel):
    appointment_id: int
    patient_id: int
    patient_name: str
    mrn: str | None = None
    appointment_time: datetime
    location: str
    provider_name: str | None = None
