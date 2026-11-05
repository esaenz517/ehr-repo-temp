"""
Disciplines Router
Lists disciplines for any signed-in person (forms and filters need them);
creating and editing them needs the discipline.manage permission (admins).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import departments as departments_crud
from app.crud import disciplines as crud
from app.database import get_db
from app.schemas.disciplines import Discipline, DisciplineCreate, DisciplineUpdate
from app.security.authorization import require_permission
from app.security.current_user import get_current_user

router = APIRouter(prefix="/disciplines", tags=["disciplines"])


@router.get("", response_model=list[Discipline])
def list_disciplines(
    is_active: bool | None = None,
    department_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.list_disciplines(db, is_active, department_id)


@router.get("/{discipline_id}", response_model=Discipline)
def get_discipline(
    discipline_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    discipline = crud.get_discipline(db, discipline_id)
    if discipline is None:
        raise HTTPException(status_code=404, detail="Discipline not found")
    return discipline


def _check_department(db: Session, department_id: int | None) -> None:
    if department_id is not None and departments_crud.get_department(db, department_id) is None:
        raise HTTPException(status_code=400, detail="Unknown department")


@router.post("", response_model=Discipline, status_code=201)
def create_discipline(
    discipline: DisciplineCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("discipline", "manage")),
):
    _check_department(db, discipline.department_id)
    if crud.code_or_name_taken(db, discipline.code, discipline.name):
        raise HTTPException(status_code=409, detail="A discipline with this code or name already exists")
    return crud.create_discipline(db, discipline)


@router.patch("/{discipline_id}", response_model=Discipline)
def update_discipline(
    discipline_id: int,
    changes: DisciplineUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("discipline", "manage")),
):
    _check_department(db, changes.department_id)
    discipline = crud.update_discipline(db, discipline_id, changes)
    if discipline is None:
        raise HTTPException(status_code=404, detail="Discipline not found")
    return discipline
