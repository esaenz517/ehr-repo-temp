'''
Patients CRUD
DB access functions for patients - list, get, create, delete.
'''

from sqlalchemy.orm import Session

from app.models.patients import Patient as PatientModel
from app.schemas.patients import PatientCreate


# Gets all patients from the DB.
def list_patients(db: Session):
    return db.query(PatientModel).order_by(PatientModel.patient_id).all()


# Gets one patient by id, or None if it doesn't exist.
def get_patient(db: Session, patient_id: int):
    return db.query(PatientModel).filter(PatientModel.patient_id == patient_id).first()


# Inserts a new patient and returns it (with its new id).
def create_patient(db: Session, patient: PatientCreate):
    db_patient = PatientModel(
        mrn=patient.mrn,
        first_name=patient.first_name,
        middle_name=patient.middle_name,
        last_name=patient.last_name,
        date_of_birth=patient.date_of_birth,
        gender=patient.gender,
        status=patient.status,
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


# Deletes a patient by id. Returns True if a row was actually deleted.
def delete_patient(db: Session, patient_id: int) -> bool:
    db_patient = get_patient(db, patient_id)
    if db_patient is None:
        return False
    db.delete(db_patient)
    db.commit()
    return True
