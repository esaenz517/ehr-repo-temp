"""
Users Router
This file defines API endpoints for managing users and their assigned roles.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import users as crud
from app.database import get_db
from app.schemas.roles import Role
from app.schemas.users import User, UserCreate
from app.security.authorization import require_permission

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[User])
def list_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user", "read")),
):
    return crud.list_users(db)


@router.get("/{user_id}", response_model=User)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user", "read")),
):
    user = crud.get_user(db, user_id)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.post("", response_model=User, status_code=201)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user", "create")),
):
    return crud.create_user(db, user)


@router.get("/{user_id}/roles", response_model=list[Role])
def get_user_roles(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user", "read")),
):
    user = crud.get_user(db, user_id)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return crud.get_user_roles(db, user_id)


@router.post("/{user_id}/roles/{role_id}", status_code=204)
def assign_role(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user", "manage_roles")),
):
    assigned = crud.assign_role(db, user_id, role_id)

    if not assigned:
        raise HTTPException(status_code=404, detail="User or role not found")


@router.delete("/{user_id}/roles/{role_id}", status_code=204)
def remove_role(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user", "manage_roles")),
):
    removed = crud.remove_role(db, user_id, role_id)

    if not removed:
        raise HTTPException(status_code=404, detail="Role assignment not found")
