"""
Users Schemas
Request/response shapes for the users API - separate from the DB model
because what a client sends/receives doesn't always match what's stored.
"""

from datetime import datetime

from pydantic import BaseModel


# Fields shared by every User.
class UserBase(BaseModel):
    name: str
    email: str
    discipline: str | None = None


# Shape of the data a client sends to create a new user.
# Password is accepted only during creation and is never returned by the API.
class UserCreate(UserBase):
    password: str


# Shape of the data the API returns.
class User(UserBase):
    user_id: int
    account_status: str
    created_at: datetime

    class Config:
        from_attributes = True
