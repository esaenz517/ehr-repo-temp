"""
Deletion Audit Router
The browser reports deletions the user cancelled at the confirmation prompt.
Actual DELETE requests are logged automatically by the deletion audit middleware.
Admins read the log (GET /audit/deletions); that needs audit.read, which only
the ADMIN role holds. Nothing in the API changes or deletes log rows.
"""


from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from sqlalchemy.orm import Session

from app.crud import deletion_audit as crud
from app.crud.rbac import user_has_permission
from app.database import get_db
from app.models.login import Login
from app.schemas.deletion_audit import DeletionAuditPage, DeletionCancelled
from app.security.current_user import get_current_login, get_current_user

router = APIRouter(prefix = "/audit/deletions", tags = ["audit"])

@router.post("/cancelled", status_code=204)
def log_cancelled_deletion(
    payload: DeletionCancelled,
    request: Request,
    db: Session = Depends(get_db),
    # Signed-in users only, so the log can't be filled by anonymous callers
    login: Login = Depends(get_current_login),
):
    crud.record(
        db,
        path=payload.path,
        outcome="cancelled",
        actor_user_id=login.userid,
        actor_username=login.username,
        client_ip=request.client.host if request.client else None,
        details=payload.label,
    )

def require_audit_read(db: Session, user) -> None:
    if not user_has_permission(db, user.user_id, "audit", "read"):
        raise HTTPException(status_code=403, detail="Admin access required")


# Admins: the deletion log, newest first, with fliters and paging
@router.get("", response_model=DeletionAuditPage)
def list_deletions(
    resource: str | None = Query(default=None, max_length=200),
    resource_id: str | None = Query(default=None, max_length=100),
    actor_user_id: int | None = None,
    outcome: str | None = Query(default=None, max_length=20),
    since: datetime | None = None,
    until: datetime | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    require_audit_read(db, user)
    total, rows = crud.search(
        db,
        resource=resource,
        resource_id=resource_id,
        actor_user_id=actor_user_id,
        outcome=outcome,
        since=since,
        until=until,
        limit=limit,
        offset=offset,
    )
    return {"total": total, "items": rows}

# Admins: the kinds of records in the log, for the page's filter
@router.get("/resources", response_model=list[str])
def list_resources(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    require_audit_read(db, user)
    return crud.resources(db)