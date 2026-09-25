"""
Current User Dependency
Development-only authentication using the X-User-Id request header.

This is so RBAC can be tested before the final authentication system
is implemented.

Do not use X-User-Id as production authentication.
"""

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.users import User


def get_current_user(
    x_user_id: int = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.user_id == x_user_id).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Unknown user",
        )

    if user.account_status != "active":
        raise HTTPException(
            status_code=403,
            detail="User account is not active",
        )

    return user
