'''
Deleiton Audit Schemas
Request shapes for reporting a deletion the user cancelled in the browser,
and response shapes for GET /audit/deletions (admin only)
'''

from datetime import datetime
from pydantic import BaseModel, Field

class DeletionCancelled(BaseModel):
    # API path the Delete button would have called, such as "/patients/12"
    path: str = Field(min_length=1, max_length=500, pattern=r"^/")
    # What the user saw in the confirmation, such as "patient Jane Doe"
    label: str | None = Field(default=None, max_length=500)

# One row of the deletion log
class DeletionAuditOut(BaseModel):
    deletion_audit_id: int
    occurred_at: datetime
    actor_user_id: int | None
    actor_username: str | None
    resource: str
    resource_id: str | None
    request_path: str
    outcome: str
    status_code: int | None
    client_ip: str | None
    details: str | None

    model_config = {"from_attributes": True}

class DeletionAuditPage(BaseModel):
    total: int
    items: list[DeletionAuditOut]