"""
Rooms Router
This file defines API endpoints for managing rooms. It includes routes for listing, retrieving, creating, and deleting rooms.
Use this router as a template to implement feature and objects
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import rooms as rooms_crud
from app.crud import room_assignment as rooms_assignment_crud
from app.database import get_db
from app.schemas.rooms import Room, RoomCreate, AssignRoom
from app.schemas.patients import Patient
from app.security.authorization import require_permission

router = APIRouter(prefix="/rooms", tags=["rooms"])


# Gets available patients
@router.get("/available-patient", response_model=list[Patient])
def available_patients(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("patient", "read")),
):
    return rooms_assignment_crud.list_available_patients(db)


# Basic Router for Rooms
@router.get("", response_model=list[Room])
def list_rooms(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("room", "read")),
):
    return rooms_crud.list_rooms(db)


# Router to get by id
@router.get("/{room_id}", response_model=Room)
def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("room", "read")),
):
    room = rooms_crud.get_room(db, room_id)

    if room is None:
        raise HTTPException(
            status_code=404,
            detail="Room not found",
        )

    return room


@router.post("", response_model=Room)
def create_room(
    room: RoomCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("room", "create")),
):
    return rooms_crud.create_room(db, room)


@router.delete("/{room_id}")
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("room", "delete")),
):
    deleted = rooms_crud.delete_room(db, room_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Room not found",
        )

    return deleted


# Assigns a patient to a room
@router.post("/{room_id}/assign/", response_model=Room)
def assign_room(
    room_id: int,
    body: AssignRoom,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("room", "update")),
):
    room = rooms_assignment_crud.assign_patient(
        db,
        room_id,
        body.patient_id,
    )

    if room is None:
        raise HTTPException(
            status_code=404,
            detail="Room or patient not found",
        )

    return room


# Unassign a patient from a room
@router.post("/{room_id}/unassign/", response_model=Room)
def unassign_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("room", "update")),
):
    room = rooms_assignment_crud.unassign_patient(
        db,
        room_id,
    )

    if room is None:
        raise HTTPException(
            status_code=404,
            detail="Room not found",
        )

    return room
