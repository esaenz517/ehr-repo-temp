"""
Permissions Model
SQLAlchemy ORM class mapped to the dbo.Permissions table.
"""

from sqlalchemy import Boolean, Column, Integer, String

from app.database import Base


class Permission(Base):
    __tablename__ = "Permissions"
    __table_args__ = {"schema": "dbo"}

    permission_id = Column("PermissionId", Integer, primary_key=True, index=True)

    permission_code = Column("PermissionCode", String(150), unique=True, nullable=False)

    resource_type = Column("ResourceType", String(100), nullable=False)

    action = Column("Action", String(50), nullable=False)

    required_discipline = Column("RequiredDiscipline", String(100), nullable=True)

    sensitivity_level = Column("SensitivityLevel", String(100), nullable=True)

    note_type_restriction = Column("NoteTypeRestriction", String(100), nullable=True)

    care_context = Column("CareContext", String(50), nullable=True)

    is_active = Column("IsActive", Boolean, nullable=False, default=True)
