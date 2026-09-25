"""
RBAC CRUD
DB access functions for evaluating user role and permission assignments.
"""

from sqlalchemy.orm import Session

from app.models.permissions import Permission
from app.models.role_permissions import RolePermission
from app.models.roles import Role
from app.models.user_roles import UserRole


def user_has_permission(
    db: Session,
    user_id: int,
    resource_type: str,
    action: str,
) -> bool:
    """
    Checks whether a user has a general permission through any active role.
    General permissions are permissions that do not contain contextual
    restrictions for discipline, sensitivity, note type, or care context.
    """
    permission = (
        db.query(Permission.permission_id)
        .join(
            RolePermission,
            RolePermission.permission_id == Permission.permission_id,
        )
        .join(
            Role,
            Role.role_id == RolePermission.role_id,
        )
        .join(
            UserRole,
            UserRole.role_id == Role.role_id,
        )
        # SQL Server BIT columns need equality comparisons here.
        # Using .is_(True) can compile to "IS 1" and cause a SQL syntax error.
        .filter(
            UserRole.user_id == user_id,
            Role.is_active == True,
            Permission.is_active == True,
            Permission.resource_type == resource_type,
            Permission.action == action,
            Permission.required_discipline.is_(None),
            Permission.sensitivity_level.is_(None),
            Permission.note_type_restriction.is_(None),
            Permission.care_context.is_(None),
        )
        .first()
    )

    return permission is not None


# Contextual permissions must match their restrictions exactly so a general
# permission does not automatically grant access to sensitive records.
def user_has_contextual_permission(
    db: Session,
    user_id: int,
    resource_type: str,
    action: str,
    required_discipline: str | None = None,
    sensitivity_level: str | None = None,
    note_type_restriction: str | None = None,
    care_context: str | None = None,
) -> bool:
    """
    Checks whether a user has a permission matching the supplied
    authorization context.
    Contextual values are matched exactly. This prevents an unrestricted
    permission such as note.read from automatically granting access to
    restricted records such as psychiatry notes.
    """
    query = (
        db.query(Permission.permission_id)
        .join(
            RolePermission,
            RolePermission.permission_id == Permission.permission_id,
        )
        .join(
            Role,
            Role.role_id == RolePermission.role_id,
        )
        .join(
            UserRole,
            UserRole.role_id == Role.role_id,
        )
        # SQL Server BIT columns need equality comparisons here.
        # Using .is_(True) can compile to "IS 1" and cause a SQL syntax error.
        .filter(
            UserRole.user_id == user_id,
            Role.is_active == True,
            Permission.is_active == True,
            Permission.resource_type == resource_type,
            Permission.action == action,
        )
    )

    if required_discipline is None:
        query = query.filter(Permission.required_discipline.is_(None))
    else:
        query = query.filter(Permission.required_discipline == required_discipline)

    if sensitivity_level is None:
        query = query.filter(Permission.sensitivity_level.is_(None))
    else:
        query = query.filter(Permission.sensitivity_level == sensitivity_level)

    if note_type_restriction is None:
        query = query.filter(Permission.note_type_restriction.is_(None))
    else:
        query = query.filter(Permission.note_type_restriction == note_type_restriction)

    if care_context is None:
        query = query.filter(Permission.care_context.is_(None))
    else:
        query = query.filter(Permission.care_context == care_context)

    return query.first() is not None
