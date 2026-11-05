"""
Disciplines Model
SQLAlchemy ORM class mapped to the dbo.Disciplines table.
The kind of clinician a person acts as inside a chart (Nursing, Pharmacy, ...).
"""

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String

from app.database import Base


class Discipline(Base):
    __tablename__ = "Disciplines"
    __table_args__ = {"schema": "dbo"}

    discipline_id = Column("DisciplineId", Integer, primary_key=True, index=True)
    code = Column("Code", String(50), unique=True, nullable=False)
    name = Column("Name", String(150), unique=True, nullable=False)
    department_id = Column(
        "DepartmentId", Integer, ForeignKey("dbo.Departments.DepartmentId"), nullable=True
    )
    is_active = Column("IsActive", Boolean, nullable=False, default=True)
