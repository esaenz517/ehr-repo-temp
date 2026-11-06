"""
Patient Portal Router
Read-only endpoints for a signed-in patient to see their own record.

No route takes a patient id: get_current_patient() resolves the patient from
the session cookie, so a patient cannot ask for anyone else's data. Staff
accounts get 403 here, and patient accounts get 403 from the staff API
(reject_patient_accounts in main.py).

Existing staff CRUD functions are reused where they already return what the
portal needs; crud/portal.py adds the rest.
"""

from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import billing as billing_crud
from app.crud import insurance as insurance_crud
from app.crud import medical_history as history_crud
from app.crud import portal as crud
from app.database import get_db
from app.models.patients import Patient
from app.schemas.portal import (
    PortalAllergy,
    PortalAppointment,
    PortalBilling,
    PortalFamilyHistory,
    PortalInsurance,
    PortalLabResult,
    PortalMedicalHistory,
    PortalMedication,
    PortalProfile,
    PortalVital,
)
from app.security.current_user import get_current_patient

router = APIRouter(prefix="/portal", tags=["patient portal"])


@router.get("/me", response_model=PortalProfile)
def my_profile(patient: Patient = Depends(get_current_patient)):
    return patient


@router.get("/appointments", response_model=list[PortalAppointment])
def my_appointments(
    patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    return crud.list_appointments(db, patient.patient_id)


@router.get("/billing", response_model=PortalBilling)
def my_billing(
    patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    charges = billing_crud.list_charges(db, patient.patient_id)
    total = sum((charge.charge_amount for charge in charges), Decimal("0"))
    return {"charges": charges, "total": total}


@router.get("/insurance", response_model=list[PortalInsurance])
def my_insurance(
    patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    return insurance_crud.list_insurance(db, patient.patient_id)


@router.get("/medical-history", response_model=list[PortalMedicalHistory])
def my_medical_history(
    patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    return history_crud.list_medical_history(db, patient.patient_id)


@router.get("/family-history", response_model=list[PortalFamilyHistory])
def my_family_history(
    patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    return history_crud.list_family_history(db, patient.patient_id)


@router.get("/medications", response_model=list[PortalMedication])
def my_medications(
    patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    return crud.list_medications(db, patient.patient_id)


@router.get("/allergies", response_model=list[PortalAllergy])
def my_allergies(
    patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    return crud.list_allergies(db, patient.patient_id)


@router.get("/vitals", response_model=list[PortalVital])
def my_vitals(
    patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    return crud.list_vitals(db, patient.patient_id)


@router.get("/lab-results", response_model=list[PortalLabResult])
def my_lab_results(
    patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    return crud.list_lab_results(db, patient.patient_id)
