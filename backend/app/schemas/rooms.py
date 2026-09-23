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
    
    class Config:
        from_attributes = True

class RoomCreate(RoomBase):
    pass



#Assigning and Unassigning Rooms
class AssignRoom(BaseModel):
    room_id: int
    
class UnassignRoom(BaseModel):
    assignment_id: int
    room_id: int
    patient_id: int
    assigned_at: datetime
    discharged_at: datetime | None = None
    
    class Config:
        from_attributes = True

    
    
    