"""
Patients Router
This file defines API endpoints for managing patients. It includes routes for listing, retrieving, creating, and deleting patients.
Use this router as a template to implement feature and objects
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import patients as crud
from app.database import get_db
from app.schemas.patients import Patient, PatientCreate
from app.security.authorization import require_permission

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=list[Patient])
def list_patients(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("patient", "read")),
):
    return crud.list_patients(db)


@router.get("/{patient_id}", response_model=Patient)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("patient", "read")),
):
    patient = crud.get_patient(db, patient_id)

    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    return patient


@router.post("", response_model=Patient, status_code=201)
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("patient", "create")),
):
    return crud.create_patient(db, patient)


@router.delete("/{patient_id}", status_code=204)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("patient", "delete")),
):
    deleted = crud.delete_patient(db, patient_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Patient not found")
