"""
Deletion Audit Middleware
Records every DELETE request in dbo.DeletionAuditLog with who sent it and how
it ended (deleted, denied, not_found, conflict, rejected, error). Because it
wraps the whole app, requests rejected before reaching a route (not signed in,
no permission, unknown id) are logged too, and new DELETE routes are covered
automatically.
"""

from fastapi import Request
from starlette.concurrency import run_in_threadpool

from app.crud import deletion_audit as crud
from app.security.session_cookie import SESSION_COOKIE

# AI was used to assist in building this module 

async def deletion_audit_middleware(request: Request, call_next):
    if request.method != "DELETE":
        return await call_next(request)

    # Identify the caller before the route runs (the route may end the session).
    actor_user_id, actor_username = await run_in_threadpool(
        crud.lookup_actor, request.cookies.get(SESSION_COOKIE)
    )

    fields = dict(
        path=request.url.path,
        actor_user_id=actor_user_id,
        actor_username=actor_username,
        client_ip=request.client.host if request.client else None,
    )

    try:
        response = await call_next(request)
    except Exception as exc:
        await run_in_threadpool(
            crud.record_request,
            **fields,
            outcome="error",
            status_code=500,
            details=f"{type(exc).__name__}: {exc}",
        )
        raise

    await run_in_threadpool(
        crud.record_request,
        **fields,
        outcome=crud.outcome_for_status(response.status_code),
        status_code=response.status_code,
    )
    return response
