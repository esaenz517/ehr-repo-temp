"""
Current User Dependency
Identifies the caller from the session cookie set by POST /auth/login.

get_current_login() returns the T_Login row (staffid for cases/assignments).
get_current_user() returns the linked Users row (user_id for RBAC checks).
"""

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import sessions as sessions_crud
from app.database import get_db
from app.models.login import Login
from app.models.users import User
from app.security.session_cookie import SESSION_COOKIE


def get_current_login(
    session_token: str | None = Cookie(None, alias=SESSION_COOKIE),
    db: Session = Depends(get_db),
):
    if not session_token:
        raise HTTPException(
            status_code=401,
            detail="Not signed in",
        )

    session = sessions_crud.get_active_session(db, session_token)

    if session is None:
        raise HTTPException(
            status_code=401,
            detail="Session expired",
        )

    login = db.query(Login).filter(Login.username == session.username).first()

    if login is None:
        raise HTTPException(
            status_code=401,
            detail="Unknown login",
        )

    return login


def load_active_user(db: Session, login: Login):
    """Returns the Users row linked to a login, rejecting unlinked or inactive accounts."""
    if login.userid is None:
        raise HTTPException(
            status_code=403,
            detail="Login is not linked to a user account",
        )

    user = db.query(User).filter(User.user_id == login.userid).first()

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

def get_current_user(
    login: Login = Depends(get_current_login),
    db: Session = Depends(get_db),
):
    return load_active_user(db, login)
