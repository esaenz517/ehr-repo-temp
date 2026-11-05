"""
Departments CRUD
DB access functions for departments - list, get, create, update.
"""

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.departments import Department as DepartmentModel
from app.schemas.departments import DepartmentCreate, DepartmentUpdate


def list_departments(db: Session, is_active: bool | None = None):
    query = db.query(DepartmentModel)
    if is_active is not None:
        query = query.filter(DepartmentModel.is_active == is_active)
    return query.order_by(DepartmentModel.name).all()


def get_department(db: Session, department_id: int):
    return db.get(DepartmentModel, department_id)


def code_taken(db: Session, code: str) -> bool:
    return (
        db.query(DepartmentModel)
        .filter(func.lower(DepartmentModel.code) == code.strip().lower())
        .first()
        is not None
    )


# Codes are stored upper-case, e.g. "NURS".
def create_department(db: Session, department: DepartmentCreate):
    db_department = DepartmentModel(
        code=department.code.strip().upper(),
        name=department.name.strip(),
        is_active=True,
    )
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department


def update_department(db: Session, department_id: int, changes: DepartmentUpdate):
    db_department = get_department(db, department_id)
    if db_department is None:
        return None

    for field, value in changes.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(db_department, field, value)

    db.commit()
    db.refresh(db_department)
    return db_department
