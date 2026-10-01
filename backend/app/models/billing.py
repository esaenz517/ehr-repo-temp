"""
Billing Model
SQLAlchemy ORM class mapped to the dbo.BillingCharges table.
Stores charge summary and charge amount for a patient.
"""

from sqlalchemy import Column, ForeignKey, Integer, Numeric, String

from app.database import Base


class BillingCharge(Base):
    __tablename__ = "BillingCharges"
    __table_args__ = {"schema": "dbo"}

    charge_id = Column(
        "ChargeId",
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

    charge_summary = Column(
        "ChargeSummary",
        String(500),
        nullable=False,
    )

    charge_amount = Column(
        "ChargeAmount",
        Numeric(10, 2),
        nullable=False,
    )