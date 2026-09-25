"""
Permissions Router
This file defines API endpoints for viewing application permissions.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import permissions as crud
from app.database import get_db
from app.schemas.permissions import Permission
from app.security.authorization import require_permission

router = APIRouter(prefix="/permissions", tags=["permissions"])


@router.get("", response_model=list[Permission])
def list_permissions(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("permission", "read")),
):
    return crud.list_permissions(db)


@router.get("/{permission_id}", response_model=Permission)
def get_permission(
    permission_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("permission", "read")),
):
    permission = crud.get_permission(db, permission_id)

    if permission is None:
        raise HTTPException(status_code=404, detail="Permission not found")

    return permission
