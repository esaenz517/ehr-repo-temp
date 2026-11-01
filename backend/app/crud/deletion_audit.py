"""
Deletion Audit CRUD
Writes rows to dbo.DeletionAuditLog. Every DELETE request is recorded by
app.security.deletion_audit_middleware; cancelled confirmations are recorded
through POST /audit/deletions/cancelled.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.deletion_audit import DeletionAuditLog
from app.models.login import Login
from app.models.sessions import UserSession
from app.security.session_cookie import IDLE_TIMEOUT, hash_token

#AI was used to assist in bulding this module 

logger = logging.getLogger("app.deletion_audit")

def _utcnow():
    # Since DATETIME2 has no timezone, store UTC to match SYSUTCDATETOME()
    return datetime.now(timezone.utc).replace(tzinfo = None)

def parse_path(path: str) -> tuple[str, str | None]:
    """
    Splits an API path into (resource, resource id).
      /patients/12                      -> ("patients", "12")
      /patients/12/medical-history/3    -> ("patients/medical-history", "3")
      /users/4/roles/2                  -> ("users/roles", "2")
    """
    segments = [s for s in path.split("?")[0].strip("/").split("/") if s]
    names = [s for s in segments if not s.isdigit()]
    resource_id = segments[-1] if segments and segments[-1].isdigit() else None
    return ("/".join(names) or "/")[:200], resource_id

# Set outcome text based on status codes
def outcome_for_status(status_code: int) -> str:
    if 200 <= status_code < 300:
        return "deleted"
    if status_code in (401, 403):
        return "denied"
    if status_code == 404:
        return "not_found"
    if status_code == 409:
        return "conflict"
    if 400 <= status_code < 500:
        return "rejected"
    return "error"

def resolve_actor(db: Session, session_token: str | None) -> tuple[int | None, str | None]:
    """
    Read-only lookup of who sent the request. Unlike get_active_session() this
    never refreshes or deletes the session, so logging has no side effects.
    """
    if not session_token:
        return None, None

    session = (
        db.query(UserSession)
        .filter(UserSession.token_hash == hash_token(session_token))
        .first()
    )
    if session is None:
        return None, None

    now = _utcnow()
    if now >= session.expires_at or now - session.last_seen_at > IDLE_TIMEOUT:
        return None, None

    login = db.query(Login).filter(Login.username == session.username).first()
    return (login.userid if login else None), session.username

def record(
    db: Session,
    *,
    path: str,
    outcome: str,
    actor_user_id: int | None,
    actor_username: str | None,
    status_code: int | None = None,
    client_ip: str | None = None,
    details: str | None = None,
) -> DeletionAuditLog:
    resource, resource_id = parse_path(path)

    entry = DeletionAuditLog(
        occurred_at=_utcnow(),
        actor_user_id=actor_user_id,
        actor_username=actor_username,
        resource=resource,
        resource_id=resource_id,
        request_path=path[:500],
        outcome=outcome,
        status_code=status_code,
        client_ip=(client_ip or None) and client_ip[:64],
        details=(details or None) and details[:1000],
    )
    db.add(entry)
    db.commit()
    return entry


def lookup_actor(session_token: str | None) -> tuple[int | None, str | None]:
    """resolve_actor() with its own DB session; never raises."""
    db = SessionLocal()
    try:
        return resolve_actor(db, session_token)
    except Exception:
        logger.exception("Could not resolve actor for deletion audit")
        return None, None
    finally:
        db.close()


def record_request(**fields) -> None:
    """record() with its own DB session, for the middleware. Never raises, so a
    logging failure can't change the API response; failures go to the app log."""
    db = SessionLocal()
    try:
        record(db, **fields)
    except Exception:
        db.rollback()
        logger.exception("Failed to write deletion audit row: %s", fields)
    finally:
        db.close()