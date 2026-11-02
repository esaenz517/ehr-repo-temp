"""
Deletion Audit Router
The browser reports deletions the user cancelled at the confirmation prompt.
Actual DELETE requests are logged automatically by the deletion audit middleware.
"""

from fastapi import APIRouter, Depends, Request

from sqlalchemy.orm import Session

from app.crud import deletion_audit as crud
from app.database import get_db
from app.models.login import Login
from app.schemas.deletion_audit import DeletionCancelled
from app.security.current_user import get_current_login

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