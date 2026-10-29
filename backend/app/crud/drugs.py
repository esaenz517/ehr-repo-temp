'''
Drugs CRUD
DB access functions for drugs - list, get, create, update, delete.
'''

from sqlalchemy.orm import Session

from app.models.drugs import Drug as DrugModel
from app.schemas.drugs import DrugCreate, DrugUpdate


# Gets all drugs from the DB.
def list_drugs(db: Session):
    return db.query(DrugModel).order_by(DrugModel.drug_id).all()


# Gets one drug by id, or None if it doesn't exist.
def get_drug(db: Session, drug_id: int):
    return db.query(DrugModel).filter(DrugModel.drug_id == drug_id).first()


# Inserts a new drug and returns it (with its new id).
def create_drug(db: Session, drug: DrugCreate):
    db_drug = DrugModel(name=drug.name, description=drug.description)
    db.add(db_drug)
    db.commit()
    db.refresh(db_drug)
    return db_drug


# Changes only the fields that were sent. Returns None if the drug doesn't exist.
def update_drug(db: Session, drug_id: int, changes: DrugUpdate):
    db_drug = get_drug(db, drug_id)
    if db_drug is None:
        return None

    for field, value in changes.model_dump(exclude_unset=True).items():
        if field == "name" and value is None:
            continue  # name can't be empty in the database
        setattr(db_drug, field, value)

    db.commit()
    db.refresh(db_drug)
    return db_drug


# Deletes a drug by id. Returns True if a row was actually deleted.
def delete_drug(db: Session, drug_id: int) -> bool:
    db_drug = get_drug(db, drug_id)
    if db_drug is None:
        return False
    db.delete(db_drug)
    db.commit()
    return True
