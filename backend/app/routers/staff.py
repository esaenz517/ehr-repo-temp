"""
Staff Router
This file defines API endpoints for managing people (staff and students):
listing, retrieving, creating, updating, deleting, and changing their role.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import staff as crud
from app.database import get_db
from app.schemas.staff import Staff, StaffCreate, StaffUpdate
from app.security.authorization import require_permission

router = APIRouter(prefix="/staff", tags=["staff"])


# Optional filters, e.g. /staff?role=STUDENT&department_id=2
@router.get("", response_model=list[Staff])
def list_staff(
    role: str | None = None,
    department_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("staff", "read")),
):
    return crud.list_staff(db, role=role, department_id=department_id)


@router.get("/{staffid}", response_model=Staff)
def get_staff(
    staffid: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("staff", "read")),
):
    staff = crud.get_staff(db, staffid)
    if staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff


@router.post("", response_model=Staff, status_code=201)
def create_staff(
    staff: StaffCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("staff", "create")),
):
    try:
        return crud.create_staff(db, staff)
    except crud.InvalidReference as error:
        raise HTTPException(status_code=400, detail=str(error))


# Partial update, e.g. {"department_id": 2}.
@router.patch("/{staffid}", response_model=Staff)
def update_staff(
    staffid: int,
    changes: StaffUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("staff", "update")),
):
    try:
        staff = crud.update_staff(db, staffid, changes)
    except crud.InvalidReference as error:
        raise HTTPException(status_code=400, detail=str(error))
    if staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff


# Changing someone's role changes what they can do, so it has its own permission.
@router.put("/{staffid}/role/{role_id}", response_model=Staff)
def set_role(
    staffid: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user", "manage_roles")),
):
    try:
        staff = crud.set_role(db, staffid, role_id)
    except crud.InvalidReference as error:
        raise HTTPException(status_code=400, detail=str(error))
    if staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff


@router.delete("/{staffid}", status_code=204)
def delete_staff(
    staffid: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("staff", "delete")),
):
    deleted = crud.delete_staff(db, staffid)
    if not deleted:
        raise HTTPException(status_code=404, detail="Staff member not found")
