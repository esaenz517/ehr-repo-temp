
from sqlalchemy.orm import Session

from app.models.insurance import PatientInsurance
from app.schemas.insurance import InsuranceCreate, InsuranceUpdate


def list_insurance(db: Session, patient_id: int):
    return (
        db.query(PatientInsurance)
        .filter(PatientInsurance.patient_id == patient_id)
        .order_by(PatientInsurance.insurance_id)
        .all()
    )


def get_insurance(db: Session, patient_id: int, insurance_id: int):
    return (
        db.query(PatientInsurance)
        .filter(
            PatientInsurance.patient_id == patient_id,
            PatientInsurance.insurance_id == insurance_id,
        )
        .first()
    )


def create_insurance(
    db: Session,
    patient_id: int,
    insurance: InsuranceCreate,
):
    record = PatientInsurance(
        patient_id=patient_id,
        **insurance.model_dump(),
        verification_status="unverified",
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


def update_insurance(
    db: Session,
    patient_id: int,
    insurance_id: int,
    insurance: InsuranceUpdate,
):
    record = get_insurance(db, patient_id, insurance_id)

    if record is None:
        return None

    for field, value in insurance.model_dump().items():
        setattr(record, field, value)

    # Changing policy details invalidates any previous verification.
    record.verification_status = "unverified"

    db.commit()
    db.refresh(record)

    return record


def delete_insurance(
    db: Session,
    patient_id: int,
    insurance_id: int,
):
    record = get_insurance(db, patient_id, insurance_id)

    if record is None:
        return False

    db.delete(record)
    db.commit()

    return True
