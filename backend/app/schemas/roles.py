"""
Roles Schemas
Request/response shapes for the roles API - separate from the DB model
because what a client sends/receives doesn't always match what's stored.
"""

from pydantic import BaseModel


# Fields shared by every Role.
class RoleBase(BaseModel):
    role_name: str
    display_name: str
    discipline: str | None = None
    is_active: bool = True


# Shape of the data the API returns.
class Role(RoleBase):
    role_id: int

    class Config:
        from_attributes = True
