'''
Sessions Model
SQLAlchemy ORM class mapped to the dbo.Sessions table.
Describes the table already in the database. Must be added in SQL server before declaring it here.
'''

from sqlalchemy import CHAR, Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class Session(Base):
    __tablename__ = "Sessions"
    __table_args__ = {"schema": "dbo"}

    session_id = Column("SessionId", Integer, primary_key=True, index=True)
    token_hash = Column("TokenHash", CHAR(64), unique=True, nullable=False)  # SHA-256 of the cookie token
    username = Column("Username", String(254), ForeignKey("dbo.T_Login.username"), nullable=False)
    created_at = Column("CreatedAt", DateTime, nullable=False)
    last_seen_at = Column("LastSeenAt", DateTime, nullable=False)
    expires_at = Column("ExpiresAt", DateTime, nullable=False)
