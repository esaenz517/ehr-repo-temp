"""
Current User Dependency
Identifies the caller from the session cookie set by POST /auth/login.

get_current_login() returns the T_Login row; login.staff is the person (role,
  department, discipline) and login.staffid is used by cases and assignments.
get_current_user() returns the linked Users row (user_id for RBAC checks).
get_current_patient() returns the Patients row of a signed-in patient (portal).
reject_patient_accounts() keeps patient portal accounts out of the staff API.
"""

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import sessions as sessions_crud
from app.database import get_db
from app.models.login import Login
from app.models.patients import Patient
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


def get_current_patient(
    login: Login = Depends(get_current_login),
    db: Session = Depends(get_db),
) -> Patient:
    """The patient behind a portal account. Portal endpoints take the patient
    from here, never from the URL, so a patient can only ever see their own record."""
    if not login.is_patient_account:
        raise HTTPException(
            status_code=403,
            detail="Not a patient portal account",
        )

    # Disabled or locked portal accounts are refused like any other account
    load_active_user(db, login)

    return login.patient


def reject_patient_accounts(
    session_token: str | None = Cookie(None, alias=SESSION_COOKIE),
    db: Session = Depends(get_db),
):
    """Router-level guard for the staff API (see main.py).

    RBAC already refuses patients (they have no Staff row, so no role), but a
    few staff endpoints only check that someone is signed in. This turns every
    patient portal account away from all of them. Requests without a valid
    session pass through, so each endpoint still answers 401 the usual way.
    """
    if not session_token:
        return

    session = sessions_crud.get_active_session(db, session_token)
    if session is None:
        return

    login = db.query(Login).filter(Login.username == session.username).first()
    if login is not None and login.is_patient_account:
        raise HTTPException(
            status_code=403,
            detail="Patient portal accounts can only use the patient portal",
        )
