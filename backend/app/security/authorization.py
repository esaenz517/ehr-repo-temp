"""
Authorization Dependencies
Reusable FastAPI permission checks.

Use require_permission() for normal resource permissions.
Use require_contextual_permission() when access depends on additional
restrictions such as discipline, sensitivity, note type, or care context.
"""

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.rbac import (
    user_has_contextual_permission,
    user_has_permission,
)
from app.database import get_db
from app.security.current_user import get_current_user


def require_permission(resource_type: str, action: str):
    def permission_dependency(
        current_user=Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        allowed = user_has_permission(
            db=db,
            user_id=current_user.user_id,
            resource_type=resource_type,
            action=action,
        )

        if not allowed:
            raise HTTPException(
                status_code=403,
                detail=f"Permission required: {resource_type}.{action}",
            )

        return current_user

    return permission_dependency


def require_contextual_permission(
    resource_type: str,
    action: str,
    required_discipline: str | None = None,
    sensitivity_level: str | None = None,
    note_type_restriction: str | None = None,
    care_context: str | None = None,
):
    def permission_dependency(
        current_user=Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        allowed = user_has_contextual_permission(
            db=db,
            user_id=current_user.user_id,
            resource_type=resource_type,
            action=action,
            required_discipline=required_discipline,
            sensitivity_level=sensitivity_level,
            note_type_restriction=note_type_restriction,
            care_context=care_context,
        )

        if not allowed:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permission for this resource",
            )

        return current_user

    return permission_dependency
