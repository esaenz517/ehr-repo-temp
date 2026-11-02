'''
Patients CRUD
DB access functions for patients - list, get, create, update, delete.
'''

from sqlalchemy.orm import Session

from app.models.drugs import Drug as DrugModel
from app.models.patients import Patient as PatientModel
from app.schemas.patients import PatientCreate, PatientUpdate

# Columns that may be set back to NULL. Every other column is NOT NULL.
NULLABLE_FIELDS = {"mrn", "middle_name", "preferred_name", "provider_id"}


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
        preferred_name=patient.preferred_name,
        date_of_birth=patient.date_of_birth,
        gender_at_birth=patient.gender_at_birth,
        gender_identity=patient.gender_identity,
        pronouns=patient.pronouns,
        status=patient.status,
        provider_id=patient.provider_id,
    )
    if patient.drug_ids:
        db_patient.drugs = db.query(DrugModel).filter(DrugModel.drug_id.in_(patient.drug_ids)).all()
    
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


# Changes only the fields that were sent. Returns None if the patient doesn't exist.
# Raises IntegrityError if the new MRN or provider is invalid (the router turns it into a 409).
def update_patient(db: Session, patient_id: int, changes: PatientUpdate):
    db_patient = get_patient(db, patient_id)
    if db_patient is None:
        return None

    data = changes.model_dump(exclude_unset=True)
    drug_ids = data.pop("drug_ids", None)

    for field, value in data.items():
        if value is None and field not in NULLABLE_FIELDS:
            continue
        setattr(db_patient, field, value)

    # Replacing the list only adds/removes the drugs that changed, so drugs the
    # patient keeps also keep their dose, route, and frequency.
    if drug_ids is not None:
        db_patient.drugs = db.query(DrugModel).filter(DrugModel.drug_id.in_(drug_ids)).all() if drug_ids else []

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
