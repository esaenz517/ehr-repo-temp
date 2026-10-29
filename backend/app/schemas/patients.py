'''
Patients Schemas
Request/response shapes for the patients API - separate from the DB model (models.py)
because what a client sends/receives doesn't always match what's stored.
'''

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.drugs import Drug
from app.schemas.providers import Provider


# Fields shared by every Patient.
class PatientBase(BaseModel):
    mrn: str | None = None
    first_name: str
    middle_name: str | None = None
    last_name: str
    preferred_name: str | None = None
    date_of_birth: date
    gender_at_birth: str
    gender_identity: str
    pronouns: str
    status: str = "outpatient"
    provider_id: int | None = None


# Shape of the data a client (frontend) sends to create a new patient.
class PatientCreate(PatientBase):
    drug_ids: list[int] = []


# Partial update - only the fields the client sends are changed.
# drug_ids, when sent, replaces the patient's drug list.
class PatientUpdate(BaseModel):
    mrn: str | None = Field(default=None, max_length=20)
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    preferred_name: str | None = Field(default=None, max_length=50)
    date_of_birth: date | None = None
    gender_at_birth: str | None = Field(default=None, min_length=1, max_length=20)
    gender_identity: str | None = Field(default=None, min_length=1, max_length=20)
    pronouns: str | None = Field(default=None, min_length=1, max_length=20)
    status: Literal["outpatient", "inpatient"] | None = None
    provider_id: int | None = None
    drug_ids: list[int] | None = None


# Shape of the data the API returns (adds fields the DB fills in).
class Patient(PatientBase):
    patient_id: int
    provider: Provider | None = None
    drugs: list[Drug] = []

    class Config:
        from_attributes = True
