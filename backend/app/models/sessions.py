'''
Sessions Model
SQLAlchemy ORM class mapped to the dbo.Sessions table (one row per signed-in browser).
Describes the table already in the database. Must be added in SQL server before declaring it here.
'''

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database import Base


# Named UserSession so it doesn't clash with SQLAlchemy's Session
class UserSession(Base):
    __tablename__ = "Sessions"
    __table_args__ = {"schema": "dbo"}

    session_id = Column("SessionId", Integer, primary_key=True, index=True)
    token_hash = Column("TokenHash", String(64), nullable=False, unique=True)
    username = Column("Username", String(254), ForeignKey("dbo.T_Login.username"), nullable=False)
    created_at = Column("CreatedAt", DateTime, nullable=False)
    last_seen_at = Column("LastSeenAt", DateTime, nullable=False)
    expires_at = Column("ExpiresAt", DateTime, nullable=False)
