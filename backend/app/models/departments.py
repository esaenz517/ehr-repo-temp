"""
Departments Model
SQLAlchemy ORM class mapped to the dbo.Departments table.
Each person (dbo.Staff) and each course (dbo.Courses) belongs to a department.
"""

from sqlalchemy import Boolean, Column, Integer, String

from app.database import Base


class Department(Base):
    __tablename__ = "Departments"
    __table_args__ = {"schema": "dbo"}

    department_id = Column("DepartmentId", Integer, primary_key=True, index=True)
    code = Column("Code", String(10), unique=True, nullable=False)
    name = Column("Name", String(150), nullable=False)
    is_active = Column("IsActive", Boolean, nullable=False, default=True)
