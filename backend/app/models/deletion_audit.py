"""
Deletion Audit Model
SQLAlchemy ORM class mapped to the dbo.DeletionAuditLog table.
"""

from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base

class DeletionAuditLog(Base):
    __tablename__ = "DeletionAuditLog"
    __table_args__ = {"schema": "dbo"}

    deletion_audit_id = Column("DeletionAuditId", Integer, primary_key = True)
    occurred_at = Column("OccurredAt", DateTime, nullable = False)
    actor_user_id = Column("ActorUserId", Integer, nullable = True)
    actor_username = Column("ActorUserName", String(254), nullable = True)
    resource = Column("Resource", String(200), nullable = False)
    resource_id = Column("ResourceId", String(100), nullable = True)
    request_path = Column("RequestPath", String(500), nullable = False)
    outcome = Column("Outcome", String(20), nullable = False)
    status_code = Column("StatusCode", Integer, nullable = True)
    client_ip = Column("ClientIp", String(64), nullable = True)
    details = Column("Details", String(1000), nullable = True)
