from sqlalchemy import Column, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func

from app.database import Base

#Model used pull data from Database
class RoomAssignment(Base):
    __tablename__ = "RoomAssignments"
    __table_args__ = {"schema": "dbo"}

    assignment_id = Column("AssignmentId", Integer, primary_key=True, index=True)
    room_id = Column("RoomId", Integer, ForeignKey("dbo.Rooms.RoomId"), nullable=False)
    patient_id = Column("PatientId", Integer, ForeignKey("dbo.Patients.PatientId"), nullable=False)
    assigned_at = Column("AssignedAt", DateTime, server_default=func.sysutcdatetime())
    discharged_at = Column("DischargedAt", DateTime, nullable=True)