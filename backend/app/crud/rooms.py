'''
Rooms CRUD
DB access functions for rooms - list, get, create, delete.
'''

from sqlalchemy.orm import Session

from app.models.rooms import Room as RoomModel
from app.schemas.rooms import RoomCreate

# Gets all rooms from the DB.
def list_rooms(db: Session):
    return db.query(RoomModel).order_by(RoomModel.room_id).all()

#Gets one room by ID
def get_room(db:Session, room_id: int):
    return db.query(RoomModel).filter(RoomModel.room_id == room_id).first()

#Insert a new room and returns newly created id
def create_room(db: Session, room: RoomCreate):
    db_room = RoomModel(room_number=room.room_number, unit=room.unit, status=room.status)
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

#Delete a room by id
def delete_room(db: Session, room_id: int) -> bool:
    db_room = get_room(db, room_id)
    if db_room is None:
        return False
    db.delete(db_room)
    db.commit()
    return True