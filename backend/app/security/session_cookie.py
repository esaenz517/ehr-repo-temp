"""
Session Cookie
Name and settings of the cookie that carries the session token.

HttpOnly keeps JavaScript from reading the token. SameSite=Lax still sends it
from the frontend on localhost:3000 to the API on localhost:8000, because
different ports on the same host count as the same site.
Set COOKIE_SECURE=true once the app is served over HTTPS.
"""

import os

from fastapi import Response

from app.crud.sessions import MAX_SESSION_AGE

SESSION_COOKIE = "ehr_session"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        max_age=int(MAX_SESSION_AGE.total_seconds()),
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=SESSION_COOKIE,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        path="/",
    )
