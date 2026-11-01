'''
Drugs Schemas
Request/response shapes for the drugs API - separate from the DB model (models.py)
because what a client sends/receives doesn't always match what's stored.
'''

from pydantic import BaseModel, Field


# Fields shared by every Drug.
class DrugBase(BaseModel):
    name: str
    description: str | None = None


# Shape of the data a client (frontend) sends to create a new drug.
class DrugCreate(DrugBase):
    pass


# Partial update - only the fields the client sends are changed.
class DrugUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)


# Shape of the data the API returns (adds fields the DB fills in).
class Drug(DrugBase):
    drug_id: int

    class Config:
        from_attributes = True
