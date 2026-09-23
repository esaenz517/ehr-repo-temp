'''
Patients Model
SQLAlchemy ORM class mapped to the dbo.Patients table.
'''

from sqlalchemy import Column, Date, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship

from app.database import Base

# Association table for the Patients <-> Drugs many-to-many relationship (dbo.PatientDrugs).
patient_drugs = Table(
    "PatientDrugs",
    Base.metadata,
    Column("PatientId", Integer, ForeignKey("dbo.Patients.PatientId"), primary_key=True),
    Column("DrugId", Integer, ForeignKey("dbo.Drugs.DrugId"), primary_key=True),
    schema="dbo",
)


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
    provider_id = Column("ProviderId", Integer, ForeignKey("dbo.Providers.ProviderId"), nullable=True)

    # Many-to-one: the patient's medical provider.
    provider = relationship("Provider")
    # Many-to-many: the drugs a patient may take.
    drugs = relationship("Drug", secondary=patient_drugs)
