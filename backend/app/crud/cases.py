'''
cases CRUD
DB access functions for cases - list, get, create, delete.
'''

from sqlalchemy.orm import Session

from app.models.drugs import Drug as DrugModel
from app.models.cases import Case as CaseModel
from app.models.patients import Patient as PatientModel
from app.schemas.cases import CaseCreate
from app.schemas.patients import PatientCreate


# Gets all cases from the DB.
def list_cases(db: Session):
    return db.query(CaseModel).order_by(CaseModel.case_id).all()


# Gets one case by id, or None if it doesn't exist.
def get_case(db: Session, case_id: int):
    return db.query(CaseModel).filter(CaseModel.case_id == case_id).first()


# Inserts a new case and returns it (with its new id).
def create_case(db: Session, case: CaseCreate):
    db_case = CaseModel(
        patient_id=case.patient_id,
        chief_complaint=case.chief_complaint,
        narrative=case.narrative,
        created_by_staff_id=case.created_by_staff_id
    )
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    return db_case  

# Deletes a case by id. Returns True if a row was actually deleted.
def delete_case(db: Session, case_id: int) -> bool:
    db_case = get_case(db, case_id)
    if db_case is None:
        return False
    db.delete(db_case)
    db.commit()
    return True
