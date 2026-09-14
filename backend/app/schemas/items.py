'''
Items Schemas
Request/response shapes for the items API - separate from the DB model (models.py)
because what a client sends/receives doesn't always match what's stored.
Use this file as a template to implement schemas for a new feature/resource.
'''

from datetime import datetime

from pydantic import BaseModel


# Fields shared by every Item.
class ItemBase(BaseModel):
    name: str
    description: str | None = None


# Shape of the data a client (frontend) sends to create a new item.
class ItemCreate(ItemBase):
    pass


# Shape of the data the API returns (adds fields the DB fills in).
class Item(ItemBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
