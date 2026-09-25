"""
Permissions Schemas
Request/response shapes for the permissions API - separate from the DB model
because what a client sends/receives doesn't always match what's stored.
"""

from pydantic import BaseModel


# Fields shared by every Permission.
class PermissionBase(BaseModel):
    permission_code: str
    resource_type: str
    action: str
    required_discipline: str | None = None
    sensitivity_level: str | None = None
    note_type_restriction: str | None = None
    care_context: str | None = None
    is_active: bool = True


# Shape of the data the API returns.
class Permission(PermissionBase):
    permission_id: int

    class Config:
        from_attributes = True
