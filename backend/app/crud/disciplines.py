"""
Disciplines CRUD
DB access functions for disciplines - list, get, create, update.
"""

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.disciplines import Discipline as DisciplineModel
from app.schemas.disciplines import DisciplineCreate, DisciplineUpdate


def list_disciplines(
    db: Session,
    is_active: bool | None = None,
    department_id: int | None = None,
):
    query = db.query(DisciplineModel)
    if is_active is not None:
        query = query.filter(DisciplineModel.is_active == is_active)
    if department_id is not None:
        query = query.filter(DisciplineModel.department_id == department_id)
    return query.order_by(DisciplineModel.name).all()


def get_discipline(db: Session, discipline_id: int):
    return db.get(DisciplineModel, discipline_id)


# Matches a code ("NURSE") or a name ("Nursing"), any letter case.
def find_discipline(db: Session, text: str):
    clean = text.strip().lower()
    return (
        db.query(DisciplineModel)
        .filter(
            (func.lower(DisciplineModel.code) == clean)
            | (func.lower(DisciplineModel.name) == clean)
        )
        .first()
    )


def code_or_name_taken(db: Session, code: str, name: str) -> bool:
    return find_discipline(db, code) is not None or find_discipline(db, name) is not None


# Codes are stored upper-case with underscores, e.g. "PHYSICAL_THERAPY".
def create_discipline(db: Session, discipline: DisciplineCreate):
    db_discipline = DisciplineModel(
        code=discipline.code.strip().upper().replace(" ", "_"),
        name=discipline.name.strip(),
        department_id=discipline.department_id,
        is_active=True,
    )
    db.add(db_discipline)
    db.commit()
    db.refresh(db_discipline)
    return db_discipline


def update_discipline(db: Session, discipline_id: int, changes: DisciplineUpdate):
    db_discipline = get_discipline(db, discipline_id)
    if db_discipline is None:
        return None

    for field, value in changes.model_dump(exclude_unset=True).items():
        if field != "department_id" and value is None:
            continue
        setattr(db_discipline, field, value)

    db.commit()
    db.refresh(db_discipline)
    return db_discipline
