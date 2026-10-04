'''
Login Router
This file defines API endpoints for signing in with username and password,
checking the current session, and signing out.
'''

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.models.login import Login
from app.models.staff import Staff

from app.crud import login as crud
from app.crud import sessions as sessions_crud
from app.database import get_db
from app.schemas.login import LoginRequest, LoginResponse
from app.security.current_user import get_current_login
from app.security.session_cookie import SESSION_COOKIE, clear_session_cookie, set_session_cookie

router = APIRouter(prefix="/auth", tags=["auth"])


def to_response(db: Session, user: Login) -> LoginResponse:
    staff = db.query(Staff).filter(Staff.staffid == user.staffid).first()
    return LoginResponse(
        username=user.username,
        staffid=user.staffid,
        student=bool(staff and staff.student),
        admin=bool(staff and staff.admin),
    )


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = crud.check_login(db, request.username, request.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Use the stored username (e.g. "Dev"), since Sessions.Username references T_Login
    token = sessions_crud.create_session(db, user.username)
    set_session_cookie(response, token)
    return to_response(db, user)


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
