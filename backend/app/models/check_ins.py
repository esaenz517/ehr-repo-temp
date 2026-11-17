"""
Check-ins Model
SQLAlchemy ORM class mapped to the dbo.CheckIns table (the front desk queue).
Status goes waiting -> roomed -> done, or waiting -> cancelled.
"""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.appointments import Appointment
from app.models.patients import Patient
from app.models.room_assignments import RoomAssignment

WAITING = "waiting"
ROOMED = "roomed"
DONE = "done"
CANCELLED = "cancelled"
OPEN_STATUSES = (WAITING, ROOMED)


class CheckIn(Base):
    __tablename__ = "CheckIns"
    __table_args__ = {"schema": "dbo"}

    check_in_id = Column("CheckInId", Integer, primary_key=True, index=True)
    patient_id = Column("PatientId", Integer, ForeignKey("dbo.Patients.PatientId"), nullable=False)
    # NULL for walk-ins and patients registered at the desk
    appointment_id = Column("AppointmentId", Integer, ForeignKey("dbo.Appointments.AppointmentId"), nullable=True)
    # Set once the patient is in a room
    room_assignment_id = Column(
        "RoomAssignmentId", Integer, ForeignKey("dbo.RoomAssignments.AssignmentId"), nullable=True
    )
    status = Column("Status", String(20), nullable=False, default=WAITING)
    checked_in_at = Column("CheckedInAt", DateTime, server_default=func.sysutcdatetime())
    checked_out_at = Column("CheckedOutAt", DateTime, nullable=True)
    checked_in_by = Column("CheckedInBy", Integer, ForeignKey("dbo.Staff.StaffId"), nullable=True)

    patient = relationship(Patient)
    appointment = relationship(Appointment)
    room_assignment = relationship(RoomAssignment)
