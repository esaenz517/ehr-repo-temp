"""
Note Access Log Router
Admins read the clinical note access log: every note view and change, and every
refused or failed attempt. Refused attempts on mental health notes are
red-flagged (flagged=true). Needs audit.read, which only the ADMIN role holds.
Read-only: nothing in the API changes or deletes log rows.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.crud import note_access_log as crud
from app.crud.rbac import user_has_permission
from app.database import get_db
from app.schemas.note_access_log import NoteAccessLogPage, RedFlagCount
from app.security.current_user import get_current_user

router = APIRouter(prefix="/audit/note-access", tags=["audit"])

def require_audit_read(db: Session, user) -> None:
    if not user_has_permission(db, user.user_id, "audit", "read"):
        raise HTTPException(status_code=403, detail="Admin access required")

@router.get("", response_model=NoteAccessLogPage)
def list_note_access(
    note_id: int | None = None,
    patient_id: int | None = None,
    actor_user_id: int | None = None,
    action: str | None = Query(default=None, max_length=30),
    outcome: str | None = Query(default=None, max_length=20),
    since: datetime | None = None,
    until: datetime | None = None,
    flagged: bool | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    require_audit_read(db, user)

    total, flagged_total, rows = crud.search(
        db,
        note_id=note_id,
        patient_id=patient_id,
        actor_user_id=actor_user_id,
        action=action,
        outcome=outcome,
        since=since,
        until=until,
        flagged=flagged,
        limit=limit,
        offset=offset,
    )
    return {"total": total, "flagged_total": flagged_total, "items": rows}

# How many red flags were logged recently, for the sidebar badge. Only a count,
# so polling it doesn't add rows to the log (reading the log itself does).
@router.get("/red-flags", response_model=RedFlagCount)
def red_flag_count(
    days: int = Query(default=7, ge=1, le=365),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    require_audit_read(db, user)
    since = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days)
    _, count, _ = crud.search(db, since=since, flagged=True, limit=1)
    return {"days": days, "count": count}
