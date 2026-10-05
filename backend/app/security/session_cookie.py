"""
Session Cookie
Settings and helpers for the login session cookie.

The browser holds a random token in an HttpOnly cookie; dbo.Sessions stores
only its SHA-256 hash, so a leaked table can't be used to sign in.
"""

import hashlib
import os
import secrets
from datetime import timedelta

from fastapi import Response

SESSION_COOKIE = "ehr_session"
IDLE_TIMEOUT = timedelta(minutes=30)  # signed out after 30 minutes without a request
MAX_AGE = timedelta(hours=8)          # absolute cutoff, even while active

# Browsers only send Secure cookies over HTTPS, so keep this off for local http dev.
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"


def new_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    # 64 hex characters, matching Sessions.TokenHash CHAR(64)
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def set_session_cookie(response: Response, token: str):
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=int(MAX_AGE.total_seconds()),
        httponly=True,  # not readable from JavaScript
        samesite="lax",
        secure=COOKIE_SECURE,
        path="/",
    )


def clear_session_cookie(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/")
