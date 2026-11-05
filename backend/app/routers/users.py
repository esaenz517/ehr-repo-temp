"""
Users Router
This file defines API endpoints for managing accounts (email, password, status).
A person's role is on their staff row: see PUT /staff/{staffid}/role/{role_id}.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import users as crud
from app.database import get_db
from app.schemas.users import User, UserCreate, UserStatusUpdate
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
    if crud.get_user_by_email(db, user.email) is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    return crud.create_user(db, user)


# A disabled or locked account is refused by every endpoint that needs a user.
@router.patch("/{user_id}/status", response_model=User)
def set_status(
    user_id: int,
    change: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user", "manage_roles")),
):
    if user_id == current_user.user_id and change.account_status != "active":
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")

    user = crud.set_status(db, user_id, change.account_status)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user
