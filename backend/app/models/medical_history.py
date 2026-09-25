"""
Medical and Family History Models

SQLAlchemy ORM classes for patient medical and family history.
"""

from sqlalchemy import Column, Date, ForeignKey, Integer, String
from app.database import Base

class MedicalHistory(Base):
    __tablename__ = "MedicalHistory"
    __table_args__ = {"schema": "dbo"}

    medical_history_id = Column(
        "MedicalHistoryId",
        Integer,
        primary_key=True,
        index=True
    )

    patient_id = Column(
        "PatientId",
        Integer,
        ForeignKey("dbo.Patients.PatientId"),
        nullable=False
    )

    condition = Column(
        "Condition",
        String(200),
        nullable=False
    )

    diagnosis_date = Column(
        "DiagnosisDate",
        Date,
        nullable=True
    )

    notes = Column(
        "Notes",
        String(1000),
        nullable=True
    )


class FamilyHistory(Base):
    __tablename__ = "FamilyHistory"
    __table_args__ = {"schema": "dbo"}

    family_history_id = Column(
        "FamilyHistoryId",
        Integer,
        primary_key=True,
        index=True
    )

    patient_id = Column(
        "PatientId",
        Integer,
        ForeignKey("dbo.Patients.PatientId"),
        nullable=False
    )

    relationship = Column(
        "Relationship",
        String(100),
        nullable=False
    )

    condition = Column(
        "Condition",
        String(200),
        nullable=False
    )

    notes = Column(
        "Notes",
        String(1000),
        nullable=True
    )
