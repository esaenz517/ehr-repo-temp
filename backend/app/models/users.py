"""
Users Model
SQLAlchemy ORM class mapped to the dbo.Users table.
"""

from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base


class User(Base):
    __tablename__ = "Users"
    __table_args__ = {"schema": "dbo"}

    user_id = Column("UserId", Integer, primary_key=True, index=True)

    name = Column("Name", String(200), nullable=False)

    email = Column("Email", String(320), unique=True, nullable=False)

    password_hash = Column("PasswordHash", String(500), nullable=True)

    account_status = Column(
        "AccountStatus", String(20), nullable=False, default="active"
    )

    discipline = Column("Discipline", String(100), nullable=True)

    created_at = Column("CreatedAt", DateTime, nullable=False)
