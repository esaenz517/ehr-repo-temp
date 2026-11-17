'''
Rooms Schemas
Request/response shapes for the rooms API - separate from the DB model (models.py)
because what a client sends/receives doesn't always match what's stored.
'''

from datetime import datetime
from pydantic import BaseModel

#Fields shared by every Room
class RoomBase(BaseModel):
    room_number: int
    unit: str | None = None
    status: str = "available"
    
    class Config:
        from_attributes = True

class Room(RoomBase):
    room_id: int
    # Who is in the room now (set by crud.rooms), None when it's free
    occupant_name: str | None = None
    occupant_mrn: str | None = None
    
    class Config:
        from_attributes = True

class RoomCreate(RoomBase):
    pass
