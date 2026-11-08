'''
Duo Pending Model
SQLAlchemy ORM class mapped to the dbo.DuoPending table: a login whose password
check passed and is waiting on Duo two-factor (see routers/login.py).
Describes the table already in the database. Must be added in SQL server before declaring it here.
'''

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class DuoPending(Base):
    __tablename__ = "DuoPending"
    __table_args__ = {"schema": "dbo"}

    duo_pending_id = Column("DuoPendingId", Integer, primary_key=True, index=True)
    state_hash = Column("StateHash", String(64), nullable=False, unique=True)
    username = Column("Username", String(254), ForeignKey("dbo.T_Login.username"), nullable=False)
    created_at = Column("CreatedAt", DateTime, nullable=False)
    expires_at = Column("ExpiresAt", DateTime, nullable=False)
