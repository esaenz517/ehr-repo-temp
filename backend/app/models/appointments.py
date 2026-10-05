"""
Appointments Model
SQLAlchemy ORM class mapped to the dbo.Appointments table.
"""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class Appointment(Base):
    __tablename__ = "Appointments"
    __table_args__ = {"schema": "dbo"}

    appointment_id = Column(
        "AppointmentId",
        Integer,
        primary_key=True,
        index=True,
    )

    patient_id = Column(
        "PatientId",
        Integer,
        ForeignKey("dbo.Patients.PatientId"),
        nullable=False,
    )

    provider_id = Column(
        "ProviderId",
        Integer,
        ForeignKey("dbo.Providers.ProviderId"),
        nullable=False,
    )

    appointment_datetime = Column(
        "AppointmentDateTime",
        DateTime,
        nullable=False,
    )

    location = Column(
        "Location",
        String(200),
        nullable=False,
    )

    status = Column(
        "Status",
        String(50),
        nullable=False,
        default="scheduled",
    )