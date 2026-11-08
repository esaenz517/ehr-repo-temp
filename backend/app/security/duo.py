"""
Duo Two-Factor
Settings and helpers for Duo's Universal Prompt (Web SDK v4, OIDC redirect).

Flow (routers/login.py):
  1. POST /auth/login checks the password. With Duo on, it saves a DuoPending row
     and returns duo_auth_url instead of creating a session.
  2. The frontend sends the browser to Duo; the user approves the push / passcode.
  3. Duo redirects to GET /auth/duo/callback?state=...&duo_code=...
  4. The backend checks the state, exchanges duo_code with Duo, then creates the
     session cookie and redirects to the frontend.

Credentials come from env vars (DUO_CLIENT_ID, DUO_CLIENT_SECRET, DUO_API_HOST),
locally from the gitignored .env file through docker-compose.yml. DUO_ENABLED is
off by default, so the tests and a plain local run sign in with a password only.
"""

import os
from datetime import timedelta
from functools import lru_cache

from duo_universal.client import Client, DuoException  # noqa: F401 (re-exported)
from fastapi import Response

DUO_ENABLED = os.getenv("DUO_ENABLED", "false").lower() == "true"
# Patient portal accounts skip Duo unless this is on (each enrolled Duo user uses a license)
DUO_INCLUDE_PATIENTS = os.getenv("DUO_INCLUDE_PATIENTS", "false").lower() == "true"

DUO_CLIENT_ID = os.getenv("DUO_CLIENT_ID", "")
DUO_CLIENT_SECRET = os.getenv("DUO_CLIENT_SECRET", "")
DUO_API_HOST = os.getenv("DUO_API_HOST", "")
# Where Duo sends the browser back: the backend's /auth/duo/callback, as the browser sees it
DUO_REDIRECT_URI = os.getenv("DUO_REDIRECT_URI", "http://localhost:8000/auth/duo/callback")
# Where the callback sends the browser once it's done
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

PENDING_TTL = timedelta(minutes=5)  # time allowed to finish the Duo prompt

# Holds the Duo state in the browser that started the login, so the callback only
# completes a login for that same browser (stops someone handing a victim their link).
DUO_STATE_COOKIE = "ehr_duo_state"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"


def duo_applies_to(login) -> bool:
    """Whether this account must pass Duo after its password check."""
    if not DUO_ENABLED:
        return False
    return login.staff is not None or DUO_INCLUDE_PATIENTS


@lru_cache
def get_client() -> Client:
    if not (DUO_CLIENT_ID and DUO_CLIENT_SECRET and DUO_API_HOST):
        raise DuoException("DUO_ENABLED is true but the Duo credentials are not set")
    return Client(DUO_CLIENT_ID, DUO_CLIENT_SECRET, DUO_API_HOST, DUO_REDIRECT_URI)


def set_state_cookie(response: Response, state: str):
    response.set_cookie(
        DUO_STATE_COOKIE,
        state,
        max_age=int(PENDING_TTL.total_seconds()),
        httponly=True,
        samesite="lax",  # sent on Duo's top-level redirect back to the callback
        secure=COOKIE_SECURE,
        path="/",
    )


def clear_state_cookie(response: Response):
    response.delete_cookie(DUO_STATE_COOKIE, path="/")
