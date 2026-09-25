"""
Permissions CRUD
DB access functions for permissions - list and get.
"""

from sqlalchemy.orm import Session

from app.models.permissions import Permission as PermissionModel


# Gets all permissions from the DB.
def list_permissions(db: Session):
    return db.query(PermissionModel).order_by(PermissionModel.permission_id).all()


# Gets one permission by id, or None if it doesn't exist.
def get_permission(db: Session, permission_id: int):
    return (
        db.query(PermissionModel)
        .filter(PermissionModel.permission_id == permission_id)
        .first()
    )
