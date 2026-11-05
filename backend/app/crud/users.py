"""
Users CRUD
DB access functions for accounts - list, get, create, and change status.
"""

from datetime import datetime, timezone

import bcrypt
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.users import User as UserModel
from app.schemas.users import UserCreate


# Gets all users from the DB.
def list_users(db: Session):
    return db.query(UserModel).order_by(UserModel.user_id).all()


# Gets one user by id, or None if it doesn't exist.
def get_user(db: Session, user_id: int):
    return db.query(UserModel).filter(UserModel.user_id == user_id).first()


# Gets one user by email (any letter case), or None.
def get_user_by_email(db: Session, email: str):
    return (
        db.query(UserModel)
        .filter(func.lower(UserModel.email) == email.strip().lower())
        .first()
    )


# Inserts a new account and returns it.
def create_user(db: Session, user: UserCreate):
    password_hash = bcrypt.hashpw(
        user.password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    db_user = UserModel(
        email=user.email.strip().lower(),
        password_hash=password_hash,
        account_status="active",
        created_at=datetime.now(timezone.utc).replace(tzinfo=None),
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


# Sets active / disabled / locked. Returns None if the user doesn't exist.
def set_status(db: Session, user_id: int, account_status: str):
    db_user = get_user(db, user_id)
    if db_user is None:
        return None

    db_user.account_status = account_status
    db.commit()
    db.refresh(db_user)
    return db_user
