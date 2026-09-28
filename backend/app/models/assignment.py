'''
Assignment Model
SQLAlchemy ORM class mapped to the dbo.Assignment table.
Describes the table already in the database. Must be added in SQL Server before declaring it here.
'''

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime

from app.database import Base

class Assignment(Base):
    __tablename__ = "Assignment"
    __table_args__ = {"schema": "dbo"}

    assignment_id = Column("AssignmentId", Integer, primary_key = True)
    case_id = Column("CaseId", Integer, ForeignKey("dbo.Cases.CaseId"), nullable = False)
    encounter_status = Column("EncounterStatus", String(20), server_default = "not_started", nullable = False)
    course = Column("Course", String(100), nullable = True)
    due_date = Column("DueDate", DateTime, nullable = True)
    assignment_type = Column("AssignmentType", String(10), server_default = "graded", nullable = False)
    assigned_to = Column("AssignedTo", Integer, ForeignKey("dbo.Staff.StaffId"), nullable = False)
    assigned_by = Column("AssignedBy", Integer, ForeignKey("dbo.Staff.StaffId"), nullable = False)
