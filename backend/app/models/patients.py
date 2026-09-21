'''
Patients Model
SQLAlchemy ORM class mapped to the dbo.Patients table.
'''

from sqlalchemy import Column, Date, Integer, String

from app.database import Base


class Patient(Base):
    __tablename__ = "Patients"
    __table_args__ = {"schema": "dbo"}

    patient_id = Column("PatientId", Integer, primary_key=True, index=True)
    mrn = Column("Mrn", String(20), unique=True, nullable=True)
    first_name = Column("FirstName", String(100), nullable=False)
    middle_name = Column("MiddleName", String(100), nullable=True)
    last_name = Column("LastName", String(100), nullable=False)
    date_of_birth = Column("DateOfBirth", Date, nullable=False)
    gender = Column("Gender", String(20), nullable=True)
    status = Column("Status", String(20), nullable=False, default="outpatient")
