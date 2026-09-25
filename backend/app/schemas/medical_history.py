"""
Medical and Family History Schemas

Defines request and response shapes for medical and family history API data.
"""

from datetime import date

from pydantic import BaseModel


class MedicalHistoryBase(BaseModel):
    condition: str
    diagnosis_date: date | None = None
    notes: str | None = None


class MedicalHistoryCreate(MedicalHistoryBase):
    pass


class MedicalHistory(MedicalHistoryBase):
    medical_history_id: int
    patient_id: int

    class Config:
        from_attributes = True


class FamilyHistoryBase(BaseModel):
    relationship: str
    condition: str
    notes: str | None = None


class FamilyHistoryCreate(FamilyHistoryBase):
    pass


class FamilyHistory(FamilyHistoryBase):
    family_history_id: int
    patient_id: int

    class Config:
        from_attributes = True