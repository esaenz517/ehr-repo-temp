'''
cases CRUD
DB access functions for cases - list, get, create, delete.
'''

from sqlalchemy.orm import Session

from app.models.cases import Case as CaseModel
from app.models.clinical_notes import PatientAllergy, PatientLabResult

from app.schemas.cases import CaseCreate


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
    
    # Save each allergy for patient
    for a in case.allergies:
        db.add(PatientAllergy(patient_id=case.patient_id, 
                              substance=a.substance, 
                              reaction=a.reaction))
    # Save each lab result for patient
    for lab in case.labs:
        db.add(PatientLabResult(patient_id=case.patient_id,
                                test_name=lab.test_name,
                                result=lab.result,
                                unit=lab.unit,
                                flag=lab.flag,
                                collected_at=lab.collected_at
                                ))
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
