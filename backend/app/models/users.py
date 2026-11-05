"""
Users Model
SQLAlchemy ORM class mapped to the dbo.Users table.
The account only (email, password, status). The person behind it (name, role,
discipline, department) is the dbo.Staff row whose UserId points here.
"""

from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base


class User(Base):
    __tablename__ = "Users"
    __table_args__ = {"schema": "dbo"}

    user_id = Column("UserId", Integer, primary_key=True, index=True)

    email = Column("Email", String(320), unique=True, nullable=False)

    password_hash = Column("PasswordHash", String(500), nullable=True)

    account_status = Column(
        "AccountStatus", String(20), nullable=False, default="active"
    )

    created_at = Column("CreatedAt", DateTime, nullable=False)

    @property
    def is_active(self) -> bool:
        return self.account_status == "active"
