'''
Providers Schemas
Request/response shapes for the providers API - separate from the DB model (models.py)
because what a client sends/receives doesn't always match what's stored.
'''

from pydantic import BaseModel


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


# Shape of the data the API returns (adds fields the DB fills in).
class Provider(ProviderBase):
    provider_id: int

    class Config:
        from_attributes = True
