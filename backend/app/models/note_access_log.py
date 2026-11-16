"""
Note Access Log Model
SQLAlchemy ORM class mapped to the dbo.NoteAccessLog table.
"""

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.database import Base


class NoteAccessLog(Base):
    __tablename__ = "NoteAccessLog"
    __table_args__ = {"schema": "dbo"}

    note_access_log_id = Column("NoteAccessLogId", Integer, primary_key=True)
    occurred_at = Column("OccurredAt", DateTime, nullable=False)

    actor_user_id = Column("ActorUserId", Integer, nullable=True)
    actor_username = Column("ActorUsername", String(254), nullable=True)
    actor_role = Column("ActorRole", String(50), nullable=True)

    action = Column("Action", String(30), nullable=False)
    outcome = Column("Outcome", String(20), nullable=False)
    status_code = Column("StatusCode", Integer, nullable=True)

    note_id = Column("NoteId", Integer, nullable=True)
    patient_id = Column("PatientId", Integer, nullable=True)
    note_type = Column("NoteType", String(100), nullable=True)

    method = Column("Method", String(10), nullable=False)
    request_path = Column("RequestPath", String(500), nullable=False)
    client_ip = Column("ClientIp", String(64), nullable=True)
    details = Column("Details", String(1000), nullable=True)
    # Red flag: a refused attempt on a restricted (mental health) note
    flagged = Column("Flagged", Boolean, nullable=False, default=False)
