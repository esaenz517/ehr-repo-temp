"""
Roles Router
This file defines API endpoints for viewing roles and managing their permissions.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import roles as crud
from app.database import get_db
from app.schemas.permissions import Permission
from app.schemas.roles import Role
from app.security.authorization import require_permission

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[Role])
def list_roles(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("role", "read")),
):
    return crud.list_roles(db)


@router.get("/{role_id}", response_model=Role)
def get_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("role", "read")),
):
    role = crud.get_role(db, role_id)

    if role is None:
        raise HTTPException(status_code=404, detail="Role not found")

    return role


@router.get("/{role_id}/permissions", response_model=list[Permission])
def get_role_permissions(
    role_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("role", "read")),
):
    role = crud.get_role(db, role_id)

    if role is None:
        raise HTTPException(status_code=404, detail="Role not found")

    return crud.get_role_permissions(db, role_id)


@router.post("/{role_id}/permissions/{permission_id}", status_code=204)
def assign_permission(
    role_id: int,
    permission_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("role", "manage_permissions")),
):
    assigned = crud.assign_permission(db, role_id, permission_id)

    if not assigned:
        raise HTTPException(
            status_code=404,
            detail="Role or permission not found",
        )


@router.delete("/{role_id}/permissions/{permission_id}", status_code=204)
def remove_permission(
    role_id: int,
    permission_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("role", "manage_permissions")),
):
    removed = crud.remove_permission(db, role_id, permission_id)

    if not removed:
        raise HTTPException(
            status_code=404,
            detail="Permission assignment not found",
        )
