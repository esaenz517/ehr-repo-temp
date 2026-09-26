from datetime import date

from pydantic import BaseModel

from app.schemas.drugs import Drug
from app.schemas.providers import Provider
from app.schemas.patients import Patient

class CaseBase(BaseModel):
    patient_id: int
    chief_complaint: str
    narrative: str | None = None
    created_by_staff_id: int
    
class CaseCreate(CaseBase):
    pass

class Case(CaseBase):
    case_id: int
    created_at: date
    patient: Patient | None = None

    class Config:
        from_attributes = True