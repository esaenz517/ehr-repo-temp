"""
Roles CRUD
DB access functions for roles - list, get, and permission assignment.
"""

from sqlalchemy.orm import Session

from app.models.permissions import Permission as PermissionModel
from app.models.role_permissions import RolePermission as RolePermissionModel
from app.models.roles import Role as RoleModel


# Gets all roles from the DB.
def list_roles(db: Session):
    return db.query(RoleModel).order_by(RoleModel.role_id).all()


# Gets one role by id, or None if it doesn't exist.
def get_role(db: Session, role_id: int):
    return db.query(RoleModel).filter(RoleModel.role_id == role_id).first()


# Gets all permissions assigned to a role.
def get_role_permissions(db: Session, role_id: int):
    return (
        db.query(PermissionModel)
        .join(
            RolePermissionModel,
            RolePermissionModel.permission_id == PermissionModel.permission_id,
        )
        .filter(RolePermissionModel.role_id == role_id)
        .order_by(PermissionModel.permission_id)
        .all()
    )


# Assigns a permission to a role.
def assign_permission(db: Session, role_id: int, permission_id: int) -> bool:
    role = get_role(db, role_id)

    permission = (
        db.query(PermissionModel)
        .filter(PermissionModel.permission_id == permission_id)
        .first()
    )

    if role is None or permission is None:
        return False

    existing = (
        db.query(RolePermissionModel)
        .filter(
            RolePermissionModel.role_id == role_id,
            RolePermissionModel.permission_id == permission_id,
        )
        .first()
    )

    if existing is None:
        db.add(
            RolePermissionModel(
                role_id=role_id,
                permission_id=permission_id,
            )
        )
        db.commit()

    return True


# Removes a permission from a role.
def remove_permission(db: Session, role_id: int, permission_id: int) -> bool:
    role_permission = (
        db.query(RolePermissionModel)
        .filter(
            RolePermissionModel.role_id == role_id,
            RolePermissionModel.permission_id == permission_id,
        )
        .first()
    )

    if role_permission is None:
        return False

    db.delete(role_permission)
    db.commit()

    return True
