"""
Portal Account Schemas
Request/response shapes for giving a patient a portal account
(routers/portal_accounts.py).
"""

from datetime import datetime

from pydantic import BaseModel, Field


# What staff send to create a patient's portal account. The username defaults
# to the email; the password defaults to a generated one, returned once.
class PortalAccountCreate(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    username: str | None = Field(default=None, max_length=254)
    password: str | None = Field(default=None, min_length=1)


# A patient's portal account: the login and its status.
class PortalAccount(BaseModel):
    user_id: int
    username: str | None = None
    email: str
    account_status: str
    created_at: datetime


# Returned once when the account is created. temporary_password is set only
# when the password was generated, so staff can hand it to the patient.
class PortalAccountCreated(PortalAccount):
    temporary_password: str | None = None
