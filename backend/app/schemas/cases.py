from datetime import datetime

from pydantic import BaseModel, model_validator

#from app.schemas.drugs import Drug
#from app.schemas.providers import Provider
from app.schemas.patients import Patient
from app.schemas.rubric import RubricItemCreate

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
# The instructor types the medication name (drug_name); it's matched to an existing
# drug or added as a new one. drug_id still works for picking a known drug.
class MedicationCreate(BaseModel):
    drug_id: int | None = None
    drug_name: str | None = None
    dose: str | None = None
    route: str | None = None
    frequency: str | None = None

    @model_validator(mode="after")
    def needs_drug(self):
        if self.drug_id is None and not (self.drug_name or "").strip():
            raise ValueError("Each medication needs a drug_name or drug_id")
        return self

class CaseBase(BaseModel):
    patient_id: int
    chief_complaint: str
    narrative: str | None = None
    created_by_staff_id: int
    
class CaseCreate(CaseBase):
    allergies: list[AllergyCreate] = []
    labs: list[LabResultCreate] = []
    medications: list[MedicationCreate] = []
    rubric_items: list[RubricItemCreate] = []

class Case(CaseBase):
    case_id: int
    created_at: datetime
    patient: Patient | None = None

    class Config:
        from_attributes = True