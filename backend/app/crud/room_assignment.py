from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.patients import Patient as PatientModel
from app.models.room_assignments import RoomAssignment as RoomAssignmentModel
from app.models.rooms import Room as RoomModel


# Patients with no currently-active assignment.
def list_available_patients(db: Session):
    assigned_ids = (
        db.query(RoomAssignmentModel.patient_id)
        .filter(RoomAssignmentModel.discharged_at.is_(None))
        .subquery()
    )
    return db.query(PatientModel).filter(PatientModel.patient_id.notin_(assigned_ids)).all()

#Get rooms with no currently-active assignment.
def get_active_assignment(db: Session, room_id: int):
    return (
        db.query(RoomAssignmentModel)
        .filter(RoomAssignmentModel.room_id == room_id, RoomAssignmentModel.discharged_at.is_(None))
        .first()
    )


# Assign patient to a room
def assign_patient(db: Session, room_id: int, patient_id: int):
    room = db.query(RoomModel).filter(RoomModel.room_id == room_id).first()
    #Check if room is available
    if room is None or room.status != "available":
        return None
    #Check if patient is available
    if patient_id not in [p.patient_id for p in list_available_patients(db)]:
        return None

    assignment = RoomAssignmentModel(room_id=room_id, patient_id=patient_id)
    room.status = "occupied"
    
    db.add(assignment)
    db.commit()
    db.refresh(room)
    return room

#Unassign patient to a room
def unassign_patient(db: Session, room_id: int):
    assignment = get_active_assignment(db, room_id)
    
    #Check if assignment exists
    if assignment is None:
        return None
    
    assignment.discharged_at = datetime.now(timezone.utc)

    room = db.query(RoomModel).filter(RoomModel.room_id == room_id).first()
    room.status = "available"
    
    db.commit()
    db.refresh(room)
    return room