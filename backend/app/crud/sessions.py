'''
Sessions CRUD
DB access functions for login sessions - create, look up, refresh and delete.

The browser only ever holds the raw token; the DB only ever holds its SHA-256
hash. Times are naive UTC to match the DATETIME2 columns.
'''

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.sessions import Session as SessionModel

# Signed out after this long without a request.
IDLE_TIMEOUT = timedelta(minutes=30)
# Signed out after this long no matter what.
MAX_SESSION_AGE = timedelta(hours=8)
# Avoid a DB write on every request: only refresh LastSeenAt this often.
TOUCH_INTERVAL = timedelta(minutes=1)


def _now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_session(db: Session, username: str) -> str:
    """Creates a session row and returns the raw token to put in the cookie."""
    token = secrets.token_urlsafe(32)
    now = _now()
    db.add(SessionModel(
        token_hash=_hash_token(token),
        username=username,
        created_at=now,
        last_seen_at=now,
        expires_at=now + MAX_SESSION_AGE,
    ))
    db.commit()
    return token


def get_active_session(db: Session, token: str):
    """Returns the session for this token, or None if missing, idle too long or expired."""
    session = db.query(SessionModel).filter(SessionModel.token_hash == _hash_token(token)).first()
    if session is None:
        return None

    now = _now()
    if now >= session.expires_at or now - session.last_seen_at >= IDLE_TIMEOUT:
        db.delete(session)
        db.commit()
        return None

    if now - session.last_seen_at >= TOUCH_INTERVAL:
        session.last_seen_at = now
        db.commit()

    return session


def delete_session(db: Session, token: str) -> None:
    db.query(SessionModel).filter(SessionModel.token_hash == _hash_token(token)).delete()
    db.commit()
