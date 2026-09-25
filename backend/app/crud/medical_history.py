"""
Medical and Family History CRUD

Database access functions for patient medical and family history.
"""

from sqlalchemy.orm import Session

from app.models.medical_history import (
    MedicalHistory as MedicalHistoryModel,
    FamilyHistory as FamilyHistoryModel,
)
from app.schemas.medical_history import (
    MedicalHistoryCreate,
    FamilyHistoryCreate,
)


# Medical History

def list_medical_history(db: Session, patient_id: int):
    return (
        db.query(MedicalHistoryModel)
        .filter(MedicalHistoryModel.patient_id == patient_id)
        .order_by(MedicalHistoryModel.medical_history_id)
        .all()
    )


def create_medical_history(
    db: Session,
    patient_id: int,
    history: MedicalHistoryCreate,
):
    db_history = MedicalHistoryModel(
        patient_id=patient_id,
        condition=history.condition,
        diagnosis_date=history.diagnosis_date,
        notes=history.notes,
    )

    db.add(db_history)
    db.commit()
    db.refresh(db_history)

    return db_history


def delete_medical_history(
    db: Session,
    medical_history_id: int,
) -> bool:
    db_history = (
        db.query(MedicalHistoryModel)
        .filter(MedicalHistoryModel.medical_history_id == medical_history_id)
        .first()
    )

    if db_history is None:
        return False

    db.delete(db_history)
    db.commit()

    return True


# -------------------------
# Family History
# -------------------------

def list_family_history(db: Session, patient_id: int):
    return (
        db.query(FamilyHistoryModel)
        .filter(FamilyHistoryModel.patient_id == patient_id)
        .order_by(FamilyHistoryModel.family_history_id)
        .all()
    )


def create_family_history(
    db: Session,
    patient_id: int,
    history: FamilyHistoryCreate,
):
    db_history = FamilyHistoryModel(
        patient_id=patient_id,
        relationship=history.relationship,
        condition=history.condition,
        notes=history.notes,
    )

    db.add(db_history)
    db.commit()
    db.refresh(db_history)

    return db_history


def delete_family_history(
    db: Session,
    family_history_id: int,
) -> bool:
    db_history = (
        db.query(FamilyHistoryModel)
        .filter(FamilyHistoryModel.family_history_id == family_history_id)
        .first()
    )

    if db_history is None:
        return False

    db.delete(db_history)
    db.commit()

    return True