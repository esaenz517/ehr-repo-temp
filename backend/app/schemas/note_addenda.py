from datetime import datetime

from pydantic import BaseModel, Field


class NoteAddendumCreate(BaseModel):
    content: str = Field(min_length=1, max_length=10000)


class NoteAddendumOut(BaseModel):
    addendum_id: int
    note_id: int
    author_user_id: int
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}