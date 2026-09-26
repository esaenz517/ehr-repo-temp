from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Case(Base):
    __tablename__ = "Cases"
    __table_args__ = {"schema": "dbo"}

    case_id = Column("CaseId", Integer, primary_key=True, index=True)
    patient_id = Column("PatientId", Integer, ForeignKey("dbo.Patients.PatientId"), nullable=False)
    chief_complaint = Column("ChiefComplaint", String(500), nullable=False)
    narrative = Column("Narrative", String(4000), nullable=True)
    created_by_staff_id = Column("CreatedByStaffId", Integer, ForeignKey("dbo.Staff.StaffId"), nullable=False)
    created_at = Column("CreatedAt", DateTime, nullable=False, default=func.sysutcdatetime())
    
    patient = relationship("Patient")