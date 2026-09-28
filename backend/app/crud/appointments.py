from sqlalchemy.orm import Session

from app.models.appointments import Appointment as AppointmentModel
from app.schemas.appointments import AppointmentCreate


def list_appointments(db: Session, patient_id: int):
    return (
        db.query(AppointmentModel)
        .filter(AppointmentModel.patient_id == patient_id)
        .order_by(AppointmentModel.appointment_datetime)
        .all()
    )


def create_appointment(
    db: Session,
    patient_id: int,
    appointment: AppointmentCreate,
):
    db_appointment = AppointmentModel(
        patient_id=patient_id,
        appointment_datetime=appointment.appointment_datetime,
        location=appointment.location,
        status=appointment.status,
    )

    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)

    return db_appointment

def update_appointment(
    db: Session,
    patient_id: int,
    appointment_id: int,
    appointment: AppointmentCreate,
):
    db_appointment = (
        db.query(AppointmentModel)
        .filter(
            AppointmentModel.appointment_id == appointment_id,
            AppointmentModel.patient_id == patient_id,
        )
        .first()
    )

    if db_appointment is None:
        return None

    db_appointment.appointment_datetime = appointment.appointment_datetime
    db_appointment.location = appointment.location
    db_appointment.status = appointment.status

    db.commit()
    db.refresh(db_appointment)

    return db_appointment

def delete_appointment(
    db: Session,
    patient_id: int,
    appointment_id: int,
) -> bool:
    db_appointment = (
        db.query(AppointmentModel)
        .filter(
            AppointmentModel.appointment_id == appointment_id,
            AppointmentModel.patient_id == patient_id,
        )
        .first()
    )

    if db_appointment is None:
        return False

    db.delete(db_appointment)
    db.commit()

    return True