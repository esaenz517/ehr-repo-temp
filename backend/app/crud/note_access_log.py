"""
Note Access Log CRUD
Writes and reads dbo.NoteAccessLog.

Rows are written by app.security.note_access_middleware for every request on a
note path (see NOTE_ROUTES), whatever its outcome. 
Route handlers can add the note id behind an assignment, the note type, or
which notes a list returned by calling annotate() before they do their checks.
When a request was refused before its route ran, the note's id, patient and
type are looked up here instead.

A refused or unauthenticated attempt on a restricted (mental health) note type,
psychiatry, psychotherapy or SUD, is red-flagged (Flagged = 1).
"""

import logging
import re
from datetime import datetime, timezone

from fastapi import Request
from sqlalchemy.orm import Session

from app.crud.deletion_audit import resolve_actor
from app.database import SessionLocal
from app.models.assignment import Assignment
from app.models.clinical_notes import ClinicalNote
from app.models.login import Login
from app.models.note_access_log import NoteAccessLog
from app.note_templates import get_template

logger = logging.getLogger("app.note_access_log")

# Where handlers leave their extra details for the middleware.
STATE_KEY = "note_audit"

# (method, path pattern, action). Named groups give the ids the path carries.
NOTE_ROUTES: list[tuple[str, re.Pattern, str]] = [
    ("GET", re.compile(r"^/patients/(?P<patient_id>\d+)/clinical-notes$"), "list"),
    ("POST", re.compile(r"^/clinical-notes$"), "create"),
    ("GET", re.compile(r"^/clinical-notes/(?P<note_id>\d+)$"), "read"),
    ("PUT", re.compile(r"^/clinical-notes/(?P<note_id>\d+)$"), "update"),
    ("DELETE", re.compile(r"^/clinical-notes/(?P<note_id>\d+)$"), "archive"),
    ("GET", re.compile(r"^/clinical-notes/(?P<note_id>\d+)/versions$"), "read_versions"),
    ("GET", re.compile(r"^/clinical-notes/(?P<note_id>\d+)/addenda$"), "read_addenda"),
    ("POST", re.compile(r"^/clinical-notes/(?P<note_id>\d+)/addenda$"), "add_addendum"),
    # Notes reached through a student assignment
    ("GET", re.compile(r"^/assignments/(?P<assignment_id>\d+)/note$"), "read"),
    ("POST", re.compile(r"^/assignments/(?P<assignment_id>\d+)/submit$"), "submit"),
    ("PATCH", re.compile(r"^/assignments/(?P<assignment_id>\d+)/status$"), "review"),
    # Reading this log is itself logged, including refused attempts
    ("GET", re.compile(r"^/audit/note-access$"), "view_log"),
]

# Any method on these paths is logged; unlisted methods are logged by name.
_NOTE_PATHS = [pattern for _, pattern, _ in NOTE_ROUTES]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def classify(method: str, path: str) -> dict | None:
    """The action and ids for a note request, or None when the path isn't a note
    path (those requests aren't logged here)."""
    for route_method, pattern, action in NOTE_ROUTES:
        match = pattern.match(path)
        if match and route_method == method:
            return {"action": action, **_ids(match)}

    for pattern in _NOTE_PATHS:
        match = pattern.match(path)
        if match:
            return {"action": method.lower()[:30], **_ids(match)}

    return None


def _ids(match: re.Match) -> dict:
    found = {k: int(v) for k, v in match.groupdict().items() if v is not None}
    info = {
        "note_id": found.get("note_id"),
        "patient_id": found.get("patient_id"),
    }
    if "assignment_id" in found:
        info["assignment_id"] = found["assignment_id"]
        info["details"] = f"Assignment {found['assignment_id']}"
    return info


def annotate(request: Request, **fields) -> None:
    """Adds details to this request's log row: note_id, patient_id, note_type,
    action, details. Call it as soon as they're known, before permission checks,
    so a refused request is logged with them too."""
    current = getattr(request.state, STATE_KEY, None) or {}
    current.update({k: v for k, v in fields.items() if v is not None})
    setattr(request.state, STATE_KEY, current)


def annotate_note(request: Request, note, **extra) -> None:
    """annotate() with a ClinicalNote's id, patient and type."""
    annotate(
        request,
        note_id=note.note_id,
        patient_id=note.patient_id,
        note_type=note.note_type,
        **extra,
    )


def outcome_for_status(status_code: int) -> str:
    if 200 <= status_code < 300:
        return "success"
    if status_code == 401:
        return "unauthenticated"
    if status_code == 403:
        return "denied"
    if status_code == 404:
        return "not_found"
    if status_code == 409:
        return "conflict"
    if 400 <= status_code < 500:
        return "invalid"
    return "error"


def resolve_actor_with_role(
    db: Session, session_token: str | None
) -> tuple[int | None, str | None, str | None]:
    """Who sent the request: (user id, username, role). Read-only, like the
    deletion audit's lookup; the role is PATIENT for portal accounts."""
    user_id, username = resolve_actor(db, session_token)
    if username is None:
        return None, None, None

    login = db.query(Login).filter(Login.username == username).first()
    role = None
    if login is not None:
        if login.is_patient_account:
            role = "PATIENT"
        elif login.staff is not None:
            role = login.staff.role_name

    return user_id, username, role


def lookup_actor(session_token: str | None) -> tuple[int | None, str | None, str | None]:
    """resolve_actor_with_role() with its own DB session; never raises."""
    db = SessionLocal()
    try:
        return resolve_actor_with_role(db, session_token)
    except Exception:
        logger.exception("Could not resolve actor for note access log")
        return None, None, None
    finally:
        db.close()


# Outcomes that mean the caller wasn't allowed in
REFUSED = ("denied", "unauthenticated")


def is_restricted_type(note_type: str | None) -> bool:
    """Psychiatry, psychotherapy and SUD notes (templates with a restriction)."""
    template = get_template(note_type)
    return template is not None and template.restriction is not None


def should_flag(note_type: str | None, outcome: str) -> bool:
    """Red flag: someone was refused (or wasn't signed in) on a restricted note."""
    return outcome in REFUSED and is_restricted_type(note_type)


def fill_note_details(db: Session, fields: dict) -> None:
    """Adds the note's id, patient and type when the route didn't (for example a
    request refused before the route ran), so refused attempts on mental health
    notes can still be flagged."""
    note = None
    if fields.get("note_id") is not None and not fields.get("note_type"):
        note = db.get(ClinicalNote, fields["note_id"])
    elif fields.get("assignment_id") is not None and fields.get("note_id") is None:
        assignment = db.get(Assignment, fields["assignment_id"])
        if assignment is not None and assignment.encounter_id is not None:
            note = (
                db.query(ClinicalNote)
                .filter_by(encounter_id=assignment.encounter_id, is_archived=False)
                .order_by(ClinicalNote.created_at)
                .first()
            )

    if note is not None:
        fields["note_id"] = fields.get("note_id") or note.note_id
        fields["patient_id"] = fields.get("patient_id") or note.patient_id
        fields["note_type"] = fields.get("note_type") or note.note_type


def record(db: Session, **fields) -> NoteAccessLog:
    fill_note_details(db, fields)
    flagged = should_flag(fields.get("note_type"), fields["outcome"])
    details = fields.get("details") or None
    if flagged:
        template = get_template(fields.get("note_type"))
        flag = f"RED FLAG: unauthorized attempt on a {template.label}"
        details = f"{flag}; {details}" if details else flag

    entry = NoteAccessLog(
        occurred_at=_utcnow(),
        actor_user_id=fields.get("actor_user_id"),
        actor_username=fields.get("actor_username"),
        actor_role=fields.get("actor_role"),
        action=str(fields["action"])[:30],
        outcome=fields["outcome"],
        status_code=fields.get("status_code"),
        note_id=fields.get("note_id"),
        patient_id=fields.get("patient_id"),
        note_type=(fields.get("note_type") or None) and str(fields["note_type"])[:100],
        method=str(fields["method"])[:10],
        request_path=str(fields["request_path"])[:500],
        client_ip=(fields.get("client_ip") or None) and str(fields["client_ip"])[:64],
        details=details and str(details)[:1000],
        flagged=flagged,
    )
    db.add(entry)
    db.commit()
    return entry


def record_request(**fields) -> None:
    """record() with its own DB session, for the middleware. Never raises, so a
    logging failure can't change the API response; failures go to the app log."""
    db = SessionLocal()
    try:
        record(db, **fields)
    except Exception:
        db.rollback()
        logger.exception("Failed to write note access log row: %s", fields)
    finally:
        db.close()


def search(
    db: Session,
    *,
    note_id: int | None = None,
    patient_id: int | None = None,
    actor_user_id: int | None = None,
    action: str | None = None,
    outcome: str | None = None,
    since: datetime | None = None,
    until: datetime | None = None,
    flagged: bool | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[int, int, list[NoteAccessLog]]:
    """Log rows matching every filter given, newest first; the total count; and
    how many of the rows matching the other filters are red-flagged."""
    query = db.query(NoteAccessLog)
    if note_id is not None:
        query = query.filter(NoteAccessLog.note_id == note_id)
    if patient_id is not None:
        query = query.filter(NoteAccessLog.patient_id == patient_id)
    if actor_user_id is not None:
        query = query.filter(NoteAccessLog.actor_user_id == actor_user_id)
    if action:
        query = query.filter(NoteAccessLog.action == action)
    if outcome:
        query = query.filter(NoteAccessLog.outcome == outcome)
    if since is not None:
        query = query.filter(NoteAccessLog.occurred_at >= since)
    if until is not None:
        query = query.filter(NoteAccessLog.occurred_at <= until)

    # SQL Server BIT columns need equality comparisons
    flagged_total = query.filter(NoteAccessLog.flagged == True).count()
    if flagged is not None:
        query = query.filter(NoteAccessLog.flagged == flagged)

    total = query.count()
    rows = (
        query.order_by(
            NoteAccessLog.occurred_at.desc(),
            NoteAccessLog.note_access_log_id.desc(),
        )
        .offset(offset)
        .limit(limit)
        .all()
    )
    return total, flagged_total, rows
