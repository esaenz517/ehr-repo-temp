"""
Rooms Router
This file defines API endpoints for managing rooms. It includes routes for listing, retrieving, creating, and deleting rooms.
Patients are put in rooms (and discharged) from the help desk queue: routers/check_ins.py.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud import rooms as rooms_crud
from app.database import get_db
from app.schemas.rooms import Room, RoomCreate
from app.security.authorization import require_permission

router = APIRouter(prefix="/rooms", tags=["rooms"])


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
    try:
        deleted = rooms_crud.delete_room(db, room_id)
    except IntegrityError:
        # Room assignments (even discharged ones) keep the room's history
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This room has patient assignment history and can't be deleted",
        )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Room not found",
        )

    return deleted
