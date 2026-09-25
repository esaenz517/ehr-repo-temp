"""
Medical and Family History Router

API endpoints for managing patient medical and family history.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import medical_history as crud
from app.crud import patients as patient_crud
from app.database import get_db
from app.schemas.medical_history import (
    FamilyHistory,
    FamilyHistoryCreate,
    MedicalHistory,
    MedicalHistoryCreate,
)


router = APIRouter(prefix="/patients", tags=["medical-history"])


# Medical History

@router.get("/{patient_id}/medical-history", response_model=list[MedicalHistory])
def list_medical_history(patient_id: int, db: Session = Depends(get_db)):
    patient = patient_crud.get_patient(db, patient_id)

    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    return crud.list_medical_history(db, patient_id)


@router.post(
    "/{patient_id}/medical-history",
    response_model=MedicalHistory,
    status_code=201,
)
def create_medical_history(
    patient_id: int,
    history: MedicalHistoryCreate,
    db: Session = Depends(get_db),
):
    patient = patient_crud.get_patient(db, patient_id)

    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    return crud.create_medical_history(db, patient_id, history)


@router.delete(
    "/{patient_id}/medical-history/{medical_history_id}",
    status_code=204,
)
def delete_medical_history(
    patient_id: int,
    medical_history_id: int,
    db: Session = Depends(get_db),
):
    deleted = crud.delete_medical_history(db, medical_history_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Medical history not found")


# -------------------------
# Family History
# -------------------------

@router.get("/{patient_id}/family-history", response_model=list[FamilyHistory])
def list_family_history(patient_id: int, db: Session = Depends(get_db)):
    patient = patient_crud.get_patient(db, patient_id)

    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    return crud.list_family_history(db, patient_id)


@router.post(
    "/{patient_id}/family-history",
    response_model=FamilyHistory,
    status_code=201,
)
def create_family_history(
    patient_id: int,
    history: FamilyHistoryCreate,
    db: Session = Depends(get_db),
):
    patient = patient_crud.get_patient(db, patient_id)

    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    return crud.create_family_history(db, patient_id, history)


@router.delete(
    "/{patient_id}/family-history/{family_history_id}",
    status_code=204,
)
def delete_family_history(
    patient_id: int,
    family_history_id: int,
    db: Session = Depends(get_db),
):
    deleted = crud.delete_family_history(db, family_history_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Family history not found")