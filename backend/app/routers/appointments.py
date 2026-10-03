from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import appointments as crud
from app.database import get_db
from app.schemas.appointments import (
    Appointment,
    AppointmentCreate,
    AppointmentUpdate,
)


router = APIRouter(
    prefix="/patients/{patient_id}/appointments",
    tags=["appointments"],
)


@router.get("", response_model=list[Appointment])
def list_patient_appointments(
    patient_id: int,
    db: Session = Depends(get_db),
):
    return crud.list_appointments(db, patient_id)


@router.post(
    "",
    response_model=Appointment,
    status_code=status.HTTP_201_CREATED,
)
def create_patient_appointment(
    patient_id: int,
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
):
    return crud.create_appointment(db, patient_id, appointment)

@router.put(
    "/{appointment_id}",
    response_model=Appointment,
)
def update_patient_appointment(
    patient_id: int,
    appointment_id: int,
    appointment: AppointmentUpdate,
    db: Session = Depends(get_db),
):
    updated = crud.update_appointment(
        db,
        patient_id,
        appointment_id,
        appointment,
    )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    return updated

@router.delete(
    "/{appointment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_patient_appointment(
    patient_id: int,
    appointment_id: int,
    db: Session = Depends(get_db),
):
    deleted = crud.delete_appointment(
        db,
        patient_id,
        appointment_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )
