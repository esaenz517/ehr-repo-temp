"""
Users CRUD
DB access functions for users - list, get, create, and role assignment.
"""

from datetime import datetime, timezone

import bcrypt
from sqlalchemy.orm import Session

from app.models.roles import Role as RoleModel
from app.models.user_roles import UserRole as UserRoleModel
from app.models.users import User as UserModel
from app.schemas.users import UserCreate


# Gets all users from the DB.
def list_users(db: Session):
    return db.query(UserModel).order_by(UserModel.user_id).all()


# Gets one user by id, or None if it doesn't exist.
def get_user(db: Session, user_id: int):
    return db.query(UserModel).filter(UserModel.user_id == user_id).first()


# Inserts a new user and returns it.
def create_user(db: Session, user: UserCreate):
    password_hash = bcrypt.hashpw(
        user.password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    db_user = UserModel(
        name=user.name,
        email=user.email,
        password_hash=password_hash,
        account_status="active",
        discipline=user.discipline,
        created_at=datetime.now(timezone.utc).replace(tzinfo=None),
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


# Gets all roles assigned to a user.
def get_user_roles(db: Session, user_id: int):
    return (
        db.query(RoleModel)
        .join(
            UserRoleModel,
            UserRoleModel.role_id == RoleModel.role_id,
        )
        .filter(UserRoleModel.user_id == user_id)
        .order_by(RoleModel.role_id)
        .all()
    )


# Assigns a role to a user.
def assign_role(db: Session, user_id: int, role_id: int) -> bool:
    user = get_user(db, user_id)
    role = db.query(RoleModel).filter(RoleModel.role_id == role_id).first()

    if user is None or role is None:
        return False

    existing = (
        db.query(UserRoleModel)
        .filter(
            UserRoleModel.user_id == user_id,
            UserRoleModel.role_id == role_id,
        )
        .first()
    )

    if existing is None:
        db.add(
            UserRoleModel(
                user_id=user_id,
                role_id=role_id,
            )
        )
        db.commit()

    return True


# Removes a role from a user.
def remove_role(db: Session, user_id: int, role_id: int) -> bool:
    user_role = (
        db.query(UserRoleModel)
        .filter(
            UserRoleModel.user_id == user_id,
            UserRoleModel.role_id == role_id,
        )
        .first()
    )

    if user_role is None:
        return False

    db.delete(user_role)
    db.commit()

    return True
