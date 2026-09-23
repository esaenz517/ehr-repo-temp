'''
Rooms Router
This file defines API endpoints for managing rooms. It includes routes for listing, retrieving, creating, and deleting rooms.
Use this router as a template to implement feature and objects
'''

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import patients as crud
from app.database import get_db
#from app.schemas.rooms import RoomCreate, RoomAssign, RoomUnassign

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.get("", response_model=list[Room])
def list_rooms(db: Session = Depends(get_db)):
    return crud.list_rooms(db)