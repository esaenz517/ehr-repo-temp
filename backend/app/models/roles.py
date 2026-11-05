"""
Roles Model
SQLAlchemy ORM class mapped to the dbo.Roles table.
Three active roles: ADMIN, FACULTY_INSTRUCTOR, STUDENT. Each person (dbo.Staff) has one.
"""

from sqlalchemy import Boolean, Column, Integer, String

from app.database import Base


class Role(Base):
    __tablename__ = "Roles"
    __table_args__ = {"schema": "dbo"}

    role_id = Column("RoleId", Integer, primary_key=True, index=True)

    role_name = Column("RoleName", String(100), unique=True, nullable=False)

    display_name = Column("DisplayName", String(150), nullable=False)

    is_active = Column("IsActive", Boolean, nullable=False, default=True)
