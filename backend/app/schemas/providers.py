'''
Providers Schemas
Request/response shapes for the providers API - separate from the DB model (models.py)
because what a client sends/receives doesn't always match what's stored.
'''

from pydantic import BaseModel, Field


# Fields shared by every Provider.
class ProviderBase(BaseModel):
    first_name: str
    last_name: str
    specialty: str | None = None
    phone: str | None = None
    email: str | None = None


# Shape of the data a client (frontend) sends to create a new provider.
class ProviderCreate(ProviderBase):
    pass


# Partial update - only the fields the client sends are changed.
class ProviderUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    specialty: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=200)


# Shape of the data the API returns (adds fields the DB fills in).
class Provider(ProviderBase):
    provider_id: int

    class Config:
        from_attributes = True
