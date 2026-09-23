'''
Patients Schemas
Request/response shapes for the patients API - separate from the DB model (models.py)
because what a client sends/receives doesn't always match what's stored.
'''

from datetime import date

from pydantic import BaseModel

from app.schemas.drugs import Drug
from app.schemas.providers import Provider


# Fields shared by every Patient.
class PatientBase(BaseModel):
    mrn: str | None = None
    first_name: str
    middle_name: str | None = None
    last_name: str
    date_of_birth: date
    gender: str | None = None
    status: str = "outpatient"
    provider_id: int | None = None


# Shape of the data a client (frontend) sends to create a new patient.
class PatientCreate(PatientBase):
    drug_ids: list[int] = []


# Shape of the data the API returns (adds fields the DB fills in).
class Patient(PatientBase):
    patient_id: int
    provider: Provider | None = None
    drugs: list[Drug] = []

    class Config:
        from_attributes = True
