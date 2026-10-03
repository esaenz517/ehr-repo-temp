'''
Sessions CRUD
DB access functions for login sessions - create on login, validate per request, delete on logout
'''

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.sessions import UserSession
from app.security.session_cookie import IDLE_TIMEOUT, MAX_AGE, hash_token, new_token


def _utcnow():
    # DATETIME2 has no time zone; store naive UTC to match SYSUTCDATETIME()
    return datetime.now(timezone.utc).replace(tzinfo=None)


def create_session(db: Session, username: str) -> str:
    """Stores a new session and returns the raw token for the cookie (only its hash is saved)."""
    token = new_token()
    now = _utcnow()
    db.add(UserSession(
        token_hash=hash_token(token),
        username=username,
        created_at=now,
        last_seen_at=now,
        expires_at=now + MAX_AGE,
    ))
    db.commit()
    return token


def get_active_session(db: Session, token: str):
    """Returns the session for a token, or None if unknown, expired, or idle too long."""
    session = db.query(UserSession).filter(UserSession.token_hash == hash_token(token)).first()
    if session is None:
        return None

    now = _utcnow()
    if now >= session.expires_at or now - session.last_seen_at > IDLE_TIMEOUT:
        db.delete(session)
        db.commit()
        return None

    session.last_seen_at = now
    db.commit()
    return session


def delete_session(db: Session, token: str):
    db.query(UserSession).filter(UserSession.token_hash == hash_token(token)).delete()
    db.commit()
