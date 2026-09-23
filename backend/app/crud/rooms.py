'''
Rooms CRUD
DB access functions for rooms - list, get, create, delete.
'''

from sqlalchemy.orm import Session

from app.models.rooms import Room as RoomModel
#from app.schemas.rooms import RoomCreate, RoomAssign, RoomUnassign

# Gets all rooms from the DB.
def list_rooms(db: Session):
    return db.query(RoomModel).order_by(RoomModel.room_id).all()

