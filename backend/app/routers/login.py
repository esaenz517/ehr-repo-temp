'''
Login Router
This file defines API endpoints for signing in with username and password,
finishing Duo two-factor (when DUO_ENABLED), checking the current session,
and signing out.
'''

import logging

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.models.login import Login
from app.crud.rbac import get_role_permission_codes

from app.crud import duo_pending as duo_pending_crud
from app.crud import login as crud
from app.crud import sessions as sessions_crud
from app.database import get_db
from app.schemas.login import LoginRequest, LoginResponse
from app.security import duo
from app.security.current_user import get_current_login
from app.security.session_cookie import SESSION_COOKIE, clear_session_cookie, set_session_cookie

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


# Role reported for patient portal accounts. It is not a row in dbo.Roles:
# patients have no RBAC permissions and use only the /portal API.
PATIENT_ROLE = "PATIENT"


def to_response(db: Session, login: Login) -> LoginResponse:
    staff = login.staff
    if staff is None:
        patient = login.patient
        if patient is not None:
            return LoginResponse(
                username=login.username,
                patientid=patient.patient_id,
                first_name=patient.preferred_name or patient.first_name,
                last_name=patient.last_name,
                role=PATIENT_ROLE,
                role_display_name="Patient",
            )
        return LoginResponse(username=login.username)

    return LoginResponse(
        username=login.username,
        staffid=staff.staffid,
        first_name=staff.first_name,
        last_name=staff.last_name,
        role=staff.role_name,
        role_display_name=staff.role.display_name if staff.role else None,
        department_id=staff.department_id,
        department_code=staff.department_code,
        department_name=staff.department_name,
        discipline_id=staff.discipline_id,
        discipline_name=staff.discipline_name,
        permissions=get_role_permission_codes(db, staff.role_id),
        student=staff.is_student,
        admin=staff.is_admin,
    )


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = crud.check_login(db, request.username, request.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Two-factor: no session yet. Send the browser to Duo; /auth/duo/callback
    # creates the session once Duo confirms the second factor.
    if duo.duo_applies_to(user):
        try:
            client = duo.get_client()
            client.health_check()
            state = client.generate_state()
            auth_url = client.create_auth_url(user.username, state)
        except duo.DuoException:
            # Fail closed: never fall back to password-only sign-in
            logger.exception("Duo is unreachable or misconfigured")
            raise HTTPException(status_code=503, detail="Two-factor service unavailable")
        duo_pending_crud.create_pending(db, user.username, state)
        duo.set_state_cookie(response, state)
        return LoginResponse(username=user.username, duo_auth_url=auth_url)

    # Use the stored username (e.g. "Dev"), since Sessions.Username references T_Login
    token = sessions_crud.create_session(db, user.username)
    set_session_cookie(response, token)
    return to_response(db, user)


# Duo redirects the browser here after the Universal Prompt. Ends with a redirect
# to the frontend: signed in on success, or ?duo_error=1 to show the login page error.
@router.get("/duo/callback", include_in_schema=False)
def duo_callback(
    state: str | None = None,
    duo_code: str | None = None,
    state_cookie: str | None = Cookie(None, alias=duo.DUO_STATE_COOKIE),
    db: Session = Depends(get_db),
):
    failed = RedirectResponse(f"{duo.FRONTEND_URL}/?duo_error=1", status_code=303)
    duo.clear_state_cookie(failed)

    # Duo sends error/error_description instead of duo_code when the prompt fails
    if not state or not duo_code:
        return failed

    # Delete the pending row first, so the state can't be replayed even if the checks below fail
    username = duo_pending_crud.consume_pending(db, state)
    if username is None or state_cookie != state:
        return failed

    try:
        duo.get_client().exchange_authorization_code_for_2fa_result(duo_code, username)
    except duo.DuoException:
        logger.warning("Duo rejected the two-factor result for %s", username)
        return failed

    done = RedirectResponse(duo.FRONTEND_URL, status_code=303)
    duo.clear_state_cookie(done)
    set_session_cookie(done, sessions_crud.create_session(db, username))
    return done


# Lets the frontend restore the signed-in user after a page refresh
@router.get("/me", response_model=LoginResponse)
def me(user: Login = Depends(get_current_login), db: Session = Depends(get_db)):
    return to_response(db, user)


@router.post("/logout", status_code=204)
def logout(
    response: Response,
    session_token: str | None = Cookie(None, alias=SESSION_COOKIE),
    db: Session = Depends(get_db),
):
    if session_token:
        sessions_crud.delete_session(db, session_token)
    clear_session_cookie(response)
