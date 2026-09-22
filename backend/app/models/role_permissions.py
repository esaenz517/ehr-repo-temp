"""
Role Permissions Model
SQLAlchemy ORM class mapped to the dbo.RolePermissions junction table.

Associates roles with the permissions granted to those roles.
"""

from sqlalchemy import Column, ForeignKey, Integer

from app.database import Base


class RolePermission(Base):
    __tablename__ = "RolePermissions"
    __table_args__ = {"schema": "dbo"}

    role_id = Column(
        "RoleId", Integer, ForeignKey("dbo.Roles.RoleId"), primary_key=True
    )

    permission_id = Column(
        "PermissionId",
        Integer,
        ForeignKey("dbo.Permissions.PermissionId"),
        primary_key=True,
    )
