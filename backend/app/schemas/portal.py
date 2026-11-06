"""
Patient Portal Schemas
Response shapes for the patient portal API (routers/portal.py).

These are separate from the staff schemas on purpose: they only carry what a
patient should see about their own record (no staff, author, or internal ids
beyond each row's own id, which the frontend uses as a list key).
"""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class PortalProvider(BaseModel):
    first_name: str
    last_name: str
    specialty: str | None = None
    phone: str | None = None
    email: str | None = None

    class Config:
        from_attributes = True


# The signed-in patient's own demographics and care provider.
class PortalProfile(BaseModel):
    mrn: str | None = None
    first_name: str
    middle_name: str | None = None
    last_name: str
    preferred_name: str | None = None
    date_of_birth: date
    gender_identity: str
    pronouns: str
    status: str
    provider: PortalProvider | None = None

    class Config:
        from_attributes = True


class PortalAppointment(BaseModel):
    appointment_id: int
    appointment_datetime: datetime
    location: str
    status: str
    provider_name: str | None = None  # "Dr. First Last"
    provider_specialty: str | None = None


class PortalCharge(BaseModel):
    charge_id: int
    charge_summary: str
    charge_amount: Decimal

    class Config:
        from_attributes = True


class PortalBilling(BaseModel):
    charges: list[PortalCharge]
    total: Decimal


class PortalInsurance(BaseModel):
    insurance_id: int
    insurance_company: str
    member_id: str
    group_number: str | None = None
    policyholder_name: str
    insurance_priority: str
    coverage_start_date: date | None = None
    coverage_end_date: date | None = None
    verification_status: str

    class Config:
        from_attributes = True


class PortalMedicalHistory(BaseModel):
    medical_history_id: int
    condition: str
    diagnosis_date: date | None = None
    notes: str | None = None

    class Config:
        from_attributes = True


class PortalFamilyHistory(BaseModel):
    family_history_id: int
    relationship: str
    condition: str
    notes: str | None = None

    class Config:
        from_attributes = True


class PortalAllergy(BaseModel):
    allergy_id: int
    substance: str
    reaction: str | None = None

    class Config:
        from_attributes = True


class PortalMedication(BaseModel):
    drug_id: int
    name: str
    dosage: str | None = None
    route: str | None = None
    frequency: str | None = None


class PortalVital(BaseModel):
    vital_id: int
    recorded_at: datetime
    blood_pressure: str | None = None
    heart_rate: int | None = None
    respiratory_rate: int | None = None
    temperature_c: Decimal | None = None
    oxygen_saturation: Decimal | None = None
    height_cm: Decimal | None = None
    weight_kg: Decimal | None = None

    class Config:
        from_attributes = True


class PortalLabResult(BaseModel):
    lab_result_id: int
    test_name: str
    result: str
    unit: str | None = None
    flag: str | None = None
    collected_at: datetime

    class Config:
        from_attributes = True
