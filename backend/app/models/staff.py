'''
Staff Model
SQLAlchemy ORM class mapped to the dbo.Staff table.
Describes the table already in the database. Must be added in SQL server before declaring it here.
'''

from sqlalchemy import Boolean, Column, Integer, String

from app.database import Base


class Staff(Base):
    __tablename__ = "Staff"
    __table_args__ = {"schema": "dbo"}

    staffid = Column("StaffId", Integer, primary_key=True, index=True)
    first_name = Column("FirstName", String(100), nullable=False)
    middle_name = Column("MiddleName", String(100), nullable=True)
    last_name = Column("LastName", String(100), nullable=False)
    specialization = Column("Specialization", String(100), nullable=False)
    student = Column("Student", Boolean, nullable=False, default=False)
    admin = Column("Admin", Boolean, nullable=False, default=False)
