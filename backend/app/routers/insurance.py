
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import insurance as crud
from app.database import get_db
from app.schemas.insurance import (
    InsuranceCreate,
    InsuranceResponse,
    InsuranceUpdate,
)
from app.security.authorization import require_permission


router = APIRouter(
    prefix="/patients/{patient_id}/insurance",
    tags=["insurance"],
)


@router.get("", response_model=list[InsuranceResponse])
def list_patient_insurance(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("billing", "read")),
):
    return crud.list_insurance(db, patient_id)


@router.post(
    "",
    response_model=InsuranceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_patient_insurance(
    patient_id: int,
    insurance: InsuranceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("billing", "create")),
):
    return crud.create_insurance(db, patient_id, insurance)


@router.put("/{insurance_id}", response_model=InsuranceResponse)
def update_patient_insurance(
    patient_id: int,
    insurance_id: int,
    insurance: InsuranceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("billing", "update")),
):
    updated = crud.update_insurance(
        db, patient_id, insurance_id, insurance
    )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance record not found",
        )

    return updated


@router.delete(
    "/{insurance_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_patient_insurance(
    patient_id: int,
    insurance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("billing", "delete")),
):
    deleted = crud.delete_insurance(db, patient_id, insurance_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance record not found",
        )
