'''
Staff CRUD
DB access functions for staff - list, get, create, update, delete, change role.
'''

from sqlalchemy.orm import Session

from app.models.departments import Department
from app.models.disciplines import Discipline
from app.models.roles import Role
from app.models.staff import Staff as StaffModel
from app.schemas.staff import StaffCreate, StaffUpdate


class InvalidReference(ValueError):
    """A role, discipline, or department id that does not exist (or is inactive)."""


# Gets all staff from the DB, optionally only one role or department.
def list_staff(
    db: Session,
    role: str | None = None,
    department_id: int | None = None,
):
    query = db.query(StaffModel)
    if role is not None:
        query = query.join(Role, Role.role_id == StaffModel.role_id).filter(Role.role_name == role)
    if department_id is not None:
        query = query.filter(StaffModel.department_id == department_id)
    return query.order_by(StaffModel.staffid).all()


# Gets one staff member by id, or None if it doesn't exist.
def get_staff(db: Session, staffid: int):
    return db.query(StaffModel).filter(StaffModel.staffid == staffid).first()


# Gets the person behind an account, or None.
def get_staff_for_user(db: Session, user_id: int):
    return db.query(StaffModel).filter(StaffModel.user_id == user_id).first()


def _check_role(db: Session, role_id: int) -> Role:
    role = db.query(Role).filter(Role.role_id == role_id, Role.is_active == True).first()
    if role is None:
        raise InvalidReference("Unknown role")
    return role


def _check_discipline(db: Session, discipline_id: int | None) -> None:
    if discipline_id is not None and db.get(Discipline, discipline_id) is None:
        raise InvalidReference("Unknown discipline")


def _check_department(db: Session, department_id: int | None) -> None:
    if department_id is not None and db.get(Department, department_id) is None:
        raise InvalidReference("Unknown department")


# Inserts a new staff member and returns it (with its new id).
# Raises InvalidReference for an unknown role, discipline, or department.
def create_staff(db: Session, staff: StaffCreate):
    _check_role(db, staff.role_id)
    _check_discipline(db, staff.discipline_id)
    _check_department(db, staff.department_id)

    db_staff = StaffModel(
        first_name=staff.first_name.strip(),
        middle_name=(staff.middle_name or "").strip() or None,
        last_name=staff.last_name.strip(),
        role_id=staff.role_id,
        discipline_id=staff.discipline_id,
        department_id=staff.department_id,
    )
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff


# Changes only the fields that were sent. Returns None if the staff member doesn't exist.
# Discipline, department, and middle name can be cleared by sending null.
def update_staff(db: Session, staffid: int, changes: StaffUpdate):
    db_staff = get_staff(db, staffid)
    if db_staff is None:
        return None

    values = changes.model_dump(exclude_unset=True)
    if "discipline_id" in values:
        _check_discipline(db, values["discipline_id"])
    if "department_id" in values:
        _check_department(db, values["department_id"])

    nullable = {"middle_name", "discipline_id", "department_id"}
    for field, value in values.items():
        if field not in nullable and value is None:
            continue  # every other column is NOT NULL in the database
        setattr(db_staff, field, value)

    db.commit()
    db.refresh(db_staff)
    return db_staff


# Gives a person a new role. Returns None if the staff member doesn't exist.
def set_role(db: Session, staffid: int, role_id: int):
    db_staff = get_staff(db, staffid)
    if db_staff is None:
        return None

    _check_role(db, role_id)
    db_staff.role_id = role_id
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
