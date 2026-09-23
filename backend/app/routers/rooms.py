'''
Rooms Router
This file defines API endpoints for managing rooms. It includes routes for listing, retrieving, creating, and deleting rooms.
Use this router as a template to implement feature and objects
'''

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import rooms as crud
from app.database import get_db
from app.schemas.rooms import Room, RoomCreate

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.get("", response_model=list[Room])
def list_rooms(db: Session = Depends(get_db)):
    return crud.list_rooms(db)

@router.get("/{room_id}", response_model=Room)
def get_room(room_id: int, db: Session = Depends(get_db)):
    room = crud.get_room(db, room_id)
    return room

@router.post("", response_model=Room)
def create_room(room: RoomCreate, db: Session = Depends(get_db)):
    return crud.create_room(db, room)

@router.delete("/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db)):
    return crud.delete_room(db, room_id)