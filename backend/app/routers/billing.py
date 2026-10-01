from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import billing as crud
from app.database import get_db
from app.schemas.billing import (
    BillingCharge,
    BillingChargeCreate,
    BillingChargeUpdate,
)


router = APIRouter(
    prefix="/patients/{patient_id}/charges",
    tags=["billing"],
)


@router.get("", response_model=list[BillingCharge])
def list_patient_charges(
    patient_id: int,
    db: Session = Depends(get_db),
):
    return crud.list_charges(db, patient_id)


@router.post(
    "",
    response_model=BillingCharge,
    status_code=status.HTTP_201_CREATED,
)
def create_patient_charge(
    patient_id: int,
    charge: BillingChargeCreate,
    db: Session = Depends(get_db),
):
    return crud.create_charge(db, patient_id, charge)


@router.put(
    "/{charge_id}",
    response_model=BillingCharge,
)
def update_patient_charge(
    patient_id: int,
    charge_id: int,
    charge: BillingChargeUpdate,
    db: Session = Depends(get_db),
):
    updated = crud.update_charge(
        db,
        patient_id,
        charge_id,
        charge,
    )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Charge not found",
        )

    return updated


@router.delete(
    "/{charge_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_patient_charge(
    patient_id: int,
    charge_id: int,
    db: Session = Depends(get_db),
):
    deleted = crud.delete_charge(
        db,
        patient_id,
        charge_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Charge not found",
        )