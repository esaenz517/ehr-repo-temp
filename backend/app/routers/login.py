'''
Login Router
This file defines API endpoints for signing in with username and password,
checking who is signed in, and signing out.
'''

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.crud import login as crud
from app.crud import sessions as sessions_crud
from app.crud.rbac import get_permission_codes, get_role_names
from app.database import get_db
from app.models.login import Login
from app.schemas.login import LoginRequest, LoginResponse
from app.security.current_user import get_current_login, load_active_user
from app.security.session_cookie import (
    SESSION_COOKIE,
    clear_session_cookie,
    set_session_cookie,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def build_login_response(db: Session, login: Login) -> LoginResponse:
    user = load_active_user(db, login)
    return LoginResponse(
        username=login.username,
        staffid=login.staffid,
        userid=user.user_id,
        name=user.name,
        roles=get_role_names(db, user.user_id),
        permissions=get_permission_codes(db, user.user_id),
    )


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    login = crud.check_login(db, request.username, request.password)
    if login is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Build the response first so unlinked/inactive accounts never get a session.
    body = build_login_response(db, login)
    token = sessions_crud.create_session(db, login.username)
    set_session_cookie(response, token)
    return body


@router.get("/me", response_model=LoginResponse)
def me(login: Login = Depends(get_current_login), db: Session = Depends(get_db)):
    return build_login_response(db, login)


@router.post("/logout", status_code=204)
def logout(
    response: Response,
    session_token: str | None = Cookie(None, alias=SESSION_COOKIE),
    db: Session = Depends(get_db),
):
    if session_token:
        sessions_crud.delete_session(db, session_token)
    clear_session_cookie(response)
