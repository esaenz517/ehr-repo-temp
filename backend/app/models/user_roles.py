"""
User Roles Model
SQLAlchemy ORM class mapped to the dbo.UserRoles junction table.

Associates application users with one or more roles.
"""

from sqlalchemy import Column, ForeignKey, Integer

from app.database import Base


class UserRole(Base):
    __tablename__ = "UserRoles"
    __table_args__ = {"schema": "dbo"}

    user_id = Column(
        "UserId", Integer, ForeignKey("dbo.Users.UserId"), primary_key=True
    )

    role_id = Column(
        "RoleId", Integer, ForeignKey("dbo.Roles.RoleId"), primary_key=True
    )
