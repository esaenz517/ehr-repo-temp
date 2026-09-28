from datetime import datetime

from pydantic import BaseModel


class AppointmentBase(BaseModel):
    appointment_datetime: datetime
    location: str
    status: str = "scheduled"


class AppointmentCreate(AppointmentBase):
    pass


class Appointment(AppointmentBase):
    appointment_id: int
    patient_id: int

    class Config:
        from_attributes = True

class AppointmentUpdate(BaseModel):
    appointment_datetime: datetime
    location: str
    status: str