"""SQLAlchemy model for clinical note audit events."""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from app.database import Base


class NoteAuditEvent(Base):
    __tablename__ = "NoteAuditEvents"
    __table_args__ = {"schema": "dbo"}

    audit_event_id = Column("AuditEventId", Integer, primary_key=True)

    note_id = Column(
        "NoteId",
        Integer,
        ForeignKey("dbo.ClinicalNotes.NoteId"),
        nullable=False,
    )

    actor_user_id = Column(
        "ActorUserId",
        Integer,
        ForeignKey("dbo.Users.UserId"),
        nullable=False,
    )

    action = Column("Action", String(50), nullable=False)

    addendum_id = Column(
        "AddendumId",
        Integer,
        ForeignKey("dbo.NoteAddenda.AddendumId"),
        nullable=True,
    )

    details = Column("Details", String(1000), nullable=True)

    created_at = Column("CreatedAt", DateTime, nullable=False)