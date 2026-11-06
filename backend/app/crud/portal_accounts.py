"""
Portal Account CRUD
Gives a patient a portal account: an account (dbo.Users), a login (dbo.T_Login),
and the link from dbo.Patients.UserId. The patient then signs in on the normal
login page and lands in the patient portal.

Disabling or re-enabling the account uses the users API (PATCH /users/{id}/status).
"""

import secrets
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.crud.batch_students import EMAIL_PATTERN, USERNAME_PATTERN
from app.crud.login import hash_password
from app.models.login import Login
from app.models.patients import Patient
from app.models.users import User
from app.schemas.portal_accounts import PortalAccountCreate


class PortalAccountError(ValueError):
    """Invalid or conflicting input; the router turns it into a 4xx response."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


def _to_account(user: User, login: Login | None) -> dict:
    return {
        "user_id": user.user_id,
        "username": login.username if login else None,
        "email": user.email,
        "account_status": user.account_status,
        "created_at": user.created_at,
    }


# The patient's portal account, or None when they don't have one.
def get_account(db: Session, patient: Patient) -> dict | None:
    if patient.user_id is None:
        return None

    user = db.query(User).filter(User.user_id == patient.user_id).first()
    if user is None:
        return None

    login = db.query(Login).filter(Login.userid == user.user_id).order_by(Login.username).first()
    return _to_account(user, login)


def create_account(db: Session, patient: Patient, data: PortalAccountCreate) -> dict:
    """Creates the account, login, and link in one commit.
    Returns the account plus temporary_password when the password was generated."""
    if patient.user_id is not None:
        raise PortalAccountError("This patient already has a portal account", 409)

    email = data.email.strip().lower()
    if not EMAIL_PATTERN.fullmatch(email):
        raise PortalAccountError("Enter a valid email address")

    username = (data.username or "").strip().lower() or email
    if not USERNAME_PATTERN.fullmatch(username):
        raise PortalAccountError("Usernames may use letters, numbers, and . _ @ + -")

    if db.query(User.user_id).filter(func.lower(User.email) == email).first():
        raise PortalAccountError("That email already has an account", 409)
    if db.query(Login.username).filter(func.lower(Login.username) == username).first():
        raise PortalAccountError("That username is taken", 409)

    temporary_password = None
    password = data.password
    if not password:
        temporary_password = secrets.token_urlsafe(12)
        password = temporary_password

    user = User(
        email=email,
        password_hash=None,  # the password lives in dbo.T_Login, like staff accounts
        account_status="active",
        created_at=datetime.now(timezone.utc).replace(tzinfo=None),
    )
    db.add(user)
    db.flush()

    login = Login(username=username, password_hash=hash_password(password), userid=user.user_id)
    db.add(login)

    patient.user_id = user.user_id
    db.commit()
    db.refresh(user)

    account = _to_account(user, login)
    account["temporary_password"] = temporary_password
    return account
