'''
Staff CRUD
DB access functions for staff - list, get, create, delete.
'''

from sqlalchemy.orm import Session

from app.models.staff import Staff as StaffModel
from app.schemas.staff import StaffCreate


# Gets all staff from the DB.
def list_staff(db: Session):
    return db.query(StaffModel).order_by(StaffModel.staffid).all()


# Gets one staff member by id, or None if it doesn't exist.
def get_staff(db: Session, staffid: int):
    return db.query(StaffModel).filter(StaffModel.staffid == staffid).first()


# Inserts a new staff member and returns it (with its new id).
def create_staff(db: Session, staff: StaffCreate):
    db_staff = StaffModel(
        first_name=staff.first_name,
        middle_name=staff.middle_name,
        last_name=staff.last_name,
        specialization=staff.specialization,
        student=staff.student,
        admin=staff.admin,
    )
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff


# Deletes a staff member by id. Returns True if a row was actually deleted.
def delete_staff(db: Session, staffid: int) -> bool:
    db_staff = get_staff(db, staffid)
    if db_staff is None:
        return False
    db.delete(db_staff)
    db.commit()
    return True
