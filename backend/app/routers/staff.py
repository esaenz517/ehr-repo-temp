"""
Staff Router
This file defines API endpoints for managing staff. It includes routes for listing, retrieving, creating, updating, and deleting staff.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import staff as crud
from app.database import get_db
from app.schemas.staff import Staff, StaffCreate, StaffUpdate
from app.security.authorization import require_permission

router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("", response_model=list[Staff])
def list_staff(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("staff", "read")),
):
    return crud.list_staff(db)


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
    return crud.create_staff(db, staff)


# Partial update, e.g. {"specialization": "Cardiology"}.
@router.patch("/{staffid}", response_model=Staff)
def update_staff(
    staffid: int,
    changes: StaffUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("staff", "update")),
):
    staff = crud.update_staff(db, staffid, changes)
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
