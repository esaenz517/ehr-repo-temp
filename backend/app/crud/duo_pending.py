'''
Duo Pending CRUD
DB access functions for logins waiting on Duo two-factor - saved when the password
check passes, consumed (deleted) when Duo redirects back with the same state.
'''

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.duo_pending import DuoPending
from app.security.duo import PENDING_TTL
from app.security.session_cookie import hash_token


def _utcnow():
    # DATETIME2 has no time zone; store naive UTC to match SYSUTCDATETIME()
    return datetime.now(timezone.utc).replace(tzinfo=None)


def create_pending(db: Session, username: str, state: str):
    """Remembers which user a Duo state belongs to (only the state's hash is saved)."""
    now = _utcnow()
    # Clear out logins that were abandoned at the Duo prompt
    db.query(DuoPending).filter(DuoPending.expires_at <= now).delete()
    db.add(DuoPending(
        state_hash=hash_token(state),
        username=username,
        created_at=now,
        expires_at=now + PENDING_TTL,
    ))
    db.commit()


def consume_pending(db: Session, state: str) -> str | None:
    """Returns the username for a state and deletes the row, so a state works only once.
    None if the state is unknown or expired."""
    pending = db.query(DuoPending).filter(DuoPending.state_hash == hash_token(state)).first()
    if pending is None:
        return None

    username = pending.username
    expired = _utcnow() >= pending.expires_at
    db.delete(pending)
    db.commit()
    return None if expired else username
