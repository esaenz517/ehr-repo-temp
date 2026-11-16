"""
Note Access Middleware
Records every request on a clinical note path in dbo.NoteAccessLog: who sent it,
what they did (list, create, read, update, archive, ...), which note and patient,
and how it ended (success, unauthenticated, denied, not_found, conflict,
invalid, error).

It wraps the whole app, so requests turned away before a route runs (not signed
in, patient accounts on the staff API, missing permission) are logged as
attempts too, and red-flagged when the note is a mental health note. Route handlers add the note id, patient and note type through
app.crud.note_access_log.annotate(), which this reads after the route finishes.
"""

from fastapi import Request
from starlette.concurrency import run_in_threadpool

from app.crud import note_access_log as crud
from app.security.session_cookie import SESSION_COOKIE

# AI was utilized to assist with this module.

async def note_access_middleware(request: Request, call_next):
    info = crud.classify(request.method, request.url.path)
    if info is None or request.method == "OPTIONS":
        return await call_next(request)

    # Identify the caller before the route runs (the route may end the session).
    actor_user_id, actor_username, actor_role = await run_in_threadpool(
        crud.lookup_actor, request.cookies.get(SESSION_COOKIE)
    )

    def fields(status_code: int, outcome: str, error: str | None = None) -> dict:
        # The path's ids first, then whatever the route added
        merged = {**info, **(getattr(request.state, crud.STATE_KEY, None) or {})}
        details = merged.get("details")
        if error:
            details = f"{details}; {error}" if details else error
        return dict(
            actor_user_id=actor_user_id,
            actor_username=actor_username,
            actor_role=actor_role,
            action=merged["action"],
            outcome=outcome,
            status_code=status_code,
            note_id=merged.get("note_id"),
            patient_id=merged.get("patient_id"),
            note_type=merged.get("note_type"),
            assignment_id=merged.get("assignment_id"),
            method=request.method,
            request_path=request.url.path,
            client_ip=request.client.host if request.client else None,
            details=details,
        )

    try:
        response = await call_next(request)
    except Exception as exc:
        await run_in_threadpool(
            crud.record_request,
            **fields(500, "error", f"{type(exc).__name__}: {exc}"),
        )
        raise

    await run_in_threadpool(
        crud.record_request,
        **fields(response.status_code, crud.outcome_for_status(response.status_code)),
    )
    return response
