from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.note_addenda import NoteAddendum
from app.models.note_audit_events import NoteAuditEvent


def create_addendum(
    db: Session,
    note_id: int,
    author_user_id: int,
    content: str,
):
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    addendum = NoteAddendum(
        note_id=note_id,
        author_user_id=author_user_id,
        content=content,
        created_at=now,
    )

    db.add(addendum)
    db.flush()

    audit_event = NoteAuditEvent(
        note_id=note_id,
        actor_user_id=author_user_id,
        action="addendum_created",
        addendum_id=addendum.addendum_id,
        details="Correction addendum added to clinical note",
        created_at=now,
    )

    db.add(audit_event)

    return addendum