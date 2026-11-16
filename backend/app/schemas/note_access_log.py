"""
Note Access Log Schemas
Response shapes for GET /audit/note-access (admin only).
"""

from datetime import datetime

from pydantic import BaseModel


class NoteAccessLogOut(BaseModel):
    note_access_log_id: int
    occurred_at: datetime
    actor_user_id: int | None
    actor_username: str | None
    actor_role: str | None
    action: str
    outcome: str
    status_code: int | None
    note_id: int | None
    patient_id: int | None
    note_type: str | None
    method: str
    request_path: str
    client_ip: str | None
    details: str | None
    flagged: bool

    model_config = {"from_attributes": True}


class RedFlagCount(BaseModel):
    days: int
    count: int


class NoteAccessLogPage(BaseModel):
    total: int
    # Red flag rows among all rows matching the filters (ignores the flagged filter)
    flagged_total: int
    items: list[NoteAccessLogOut]
