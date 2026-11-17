'''
Rooms CRUD
DB access functions for rooms - list, get, create, delete.
Patients are put in rooms through the front desk queue (crud/check_ins.py).
'''

from sqlalchemy.orm import Session

from app.models.patients import Patient as PatientModel
from app.models.room_assignments import RoomAssignment as RoomAssignmentModel
from app.models.rooms import Room as RoomModel
from app.schemas.rooms import RoomCreate


# Sets occupant_name / occupant_mrn on each room from its current (not discharged) assignment
def _with_occupants(db: Session, rooms: list[RoomModel]) -> list[RoomModel]:
    current = (
        db.query(RoomAssignmentModel.room_id, PatientModel)
        .join(PatientModel, PatientModel.patient_id == RoomAssignmentModel.patient_id)
        .filter(
            RoomAssignmentModel.discharged_at.is_(None),
            RoomAssignmentModel.room_id.in_([r.room_id for r in rooms]),
        )
        .all()
    ) if rooms else []
    occupants = {room_id: patient for room_id, patient in current}
    for room in rooms:
        patient = occupants.get(room.room_id)
        room.occupant_name = f"{patient.first_name} {patient.last_name}" if patient else None
        room.occupant_mrn = patient.mrn if patient else None
    return rooms


# Gets all rooms from the DB.
def list_rooms(db: Session):
    return _with_occupants(db, db.query(RoomModel).order_by(RoomModel.room_number).all())

#Gets one room by ID
def get_room(db:Session, room_id: int):
    room = db.query(RoomModel).filter(RoomModel.room_id == room_id).first()
    return _with_occupants(db, [room])[0] if room else None

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