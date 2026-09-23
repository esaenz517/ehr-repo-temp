'''
Rooms Router
This file defines API endpoints for managing rooms. It includes routes for listing, retrieving, creating, and deleting rooms.
Use this router as a template to implement feature and objects
'''

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import rooms as rooms_crud
from app.crud import room_assignment as rooms_assignment_crud
from app.database import get_db
from app.schemas.rooms import Room, RoomCreate
from app.schemas.patients import Patient

router = APIRouter(prefix="/rooms", tags=["rooms"])

#Basic Router for Rooms
@router.get("", response_model=list[Room])
def list_rooms(db: Session = Depends(get_db)):
    return rooms_crud.list_rooms(db)

@router.get("/{room_id}", response_model=Room)
def get_room(room_id: int, db: Session = Depends(get_db)):
    room = rooms_crud.get_room(db, room_id)
    return room

@router.post("", response_model=Room)
def create_room(room: RoomCreate, db: Session = Depends(get_db)):
    return rooms_crud.create_room(db, room)

@router.delete("/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db)):
    return rooms_crud.delete_room(db, room_id)

#Gets available patients
@router.get("/available-patient", response_model=list[Patient])
def available_patients(db: Session = Depends(get_db)):
    return rooms_assignment_crud.list_available_patients(db)

#Assing patient to a room
@router.post("/{room_id}/assign/", response_model=Room)
def assign_room(room_id: int, body: RoomAssign, db: Session = Depends(get_db)):
    room = rooms_assignment_crud.assign_patient(db, room_id, body.patient_id)
    return room

#Unassign patient from a room
@router.post("/{room_id}/unassign/", response_model=Room)
def unassign_room(room_id: int, db: Session = Depends(get_db)):
    room = rooms_assignment_crud.unassign_patient(db, room_id)
    return room