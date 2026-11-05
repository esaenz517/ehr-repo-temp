"""
Departments Router
Lists departments for any signed-in person (forms and filters need them);
creating and editing them needs the department.manage permission (admins).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import departments as crud
from app.database import get_db
from app.schemas.departments import Department, DepartmentCreate, DepartmentUpdate
from app.security.authorization import require_permission
from app.security.current_user import get_current_user

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("", response_model=list[Department])
def list_departments(
    is_active: bool | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.list_departments(db, is_active)


@router.get("/{department_id}", response_model=Department)
def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    department = crud.get_department(db, department_id)
    if department is None:
        raise HTTPException(status_code=404, detail="Department not found")
    return department


@router.post("", response_model=Department, status_code=201)
def create_department(
    department: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("department", "manage")),
):
    if crud.code_taken(db, department.code):
        raise HTTPException(status_code=409, detail="A department with this code already exists")
    return crud.create_department(db, department)


@router.patch("/{department_id}", response_model=Department)
def update_department(
    department_id: int,
    changes: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("department", "manage")),
):
    department = crud.update_department(db, department_id, changes)
    if department is None:
        raise HTTPException(status_code=404, detail="Department not found")
    return department
