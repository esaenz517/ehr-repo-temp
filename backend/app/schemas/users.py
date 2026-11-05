"""
Users Schemas
Request/response shapes for the users API - separate from the DB model
because what a client sends/receives doesn't always match what's stored.

A user is an account (email, password, status). The person behind it, with
their role, is in the staff API.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


AccountStatus = Literal["active", "disabled", "locked"]


# Shape of the data a client sends to create a new account.
# Password is accepted only during creation and is never returned by the API.
class UserCreate(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1)


# Disabling or locking an account (or turning it back on) without deleting it.
class UserStatusUpdate(BaseModel):
    account_status: AccountStatus


# Shape of the data the API returns.
class User(BaseModel):
    user_id: int
    email: str
    account_status: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
