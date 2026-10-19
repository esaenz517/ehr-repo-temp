"""SQLAlchemy model for dated clinical note addenda."""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UnicodeText
from app.database import Base


class NoteAddendum(Base):
    __tablename__ = "NoteAddenda"
    __table_args__ = {"schema": "dbo"}

    addendum_id = Column("AddendumId", Integer, primary_key=True)

    note_id = Column(
        "NoteId",
        Integer,
        ForeignKey("dbo.ClinicalNotes.NoteId"),
        nullable=False,
    )

    author_user_id = Column(
        "AuthorUserId",
        Integer,
        ForeignKey("dbo.Users.UserId"),
        nullable=False,
    )

    content = Column("Content", UnicodeText, nullable=False)

    created_at = Column("CreatedAt", DateTime, nullable=False)