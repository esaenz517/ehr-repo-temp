from datetime import datetime

from pydantic import BaseModel

#from app.schemas.drugs import Drug
#from app.schemas.providers import Provider
from app.schemas.patients import Patient

#Creating an Allergy
class AllergyCreate(BaseModel):
    substance: str
    reaction: str | None = None
    
#Creating a LabResult
class LabResultCreate(BaseModel):
    test_name: str
    result: str
    unit: str | None = None
    flag: str | None = None
    collected_at: datetime
    
#Creating a Medication
class MedicationCreate(BaseModel):
    drug_id: int
    dose: str | None = None
    route: str | None = None
    frequency: str | None = None

class CaseBase(BaseModel):
    patient_id: int
    chief_complaint: str
    narrative: str | None = None
    created_by_staff_id: int
    
class CaseCreate(CaseBase):
    allergies: list[AllergyCreate] = []
    labs: list[LabResultCreate] = []
    medications: list[MedicationCreate] = []

class Case(CaseBase):
    case_id: int
    created_at: datetime
    patient: Patient | None = None

    class Config:
        from_attributes = True