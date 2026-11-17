"""
Check-ins CRUD
The front desk queue: check a patient in, put them in a room, discharge them.

A patient can only be given a room through a 'waiting' check-in, so this is the
one place patients are assigned to rooms. Each function raises CheckInError with
an HTTP status and message when the request can't be done; the router turns that
into the response.
"""

from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy.orm import Session, joinedload

from app.models.appointments import Appointment
from app.models.check_ins import CANCELLED, DONE, OPEN_STATUSES, ROOMED, WAITING, CheckIn
from app.models.patients import Patient
from app.models.providers import Provider
from app.models.room_assignments import RoomAssignment
from app.models.rooms import Room


class CheckInError(Exception):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def _now():
    # Stored like SYSUTCDATETIME(): UTC without a timezone
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _name(patient: Patient) -> str:
    return f"{patient.first_name} {patient.last_name}"


# Turns a CheckIn row into the response shape (schemas.check_ins.CheckIn)
def to_out(check_in: CheckIn) -> dict:
    assignment = check_in.room_assignment
    room = assignment.room if assignment is not None else None
    appointment = check_in.appointment
    return {
        "check_in_id": check_in.check_in_id,
        "patient_id": check_in.patient_id,
        "patient_name": _name(check_in.patient),
        "mrn": check_in.patient.mrn,
        "appointment_id": check_in.appointment_id,
        "appointment_time": appointment.appointment_datetime if appointment else None,
        "location": appointment.location if appointment else None,
        "room_id": room.room_id if room else None,
        "room_number": room.room_number if room else None,
        "status": check_in.status,
        "checked_in_at": check_in.checked_in_at,
        "roomed_at": assignment.assigned_at if assignment else None,
        "checked_out_at": check_in.checked_out_at,
    }


def _query(db: Session):
    return db.query(CheckIn).options(
        joinedload(CheckIn.patient),
        joinedload(CheckIn.appointment),
        joinedload(CheckIn.room_assignment).joinedload(RoomAssignment.room),
    )


def get_check_in(db: Session, check_in_id: int) -> CheckIn:
    check_in = _query(db).filter(CheckIn.check_in_id == check_in_id).first()
    if check_in is None:
        raise CheckInError(404, "Check-in not found")
    return check_in


# Everyone checked in and not yet discharged: waiting first, then in a room
def open_queue(db: Session) -> list[CheckIn]:
    rows = (
        _query(db)
        .filter(CheckIn.status.in_(OPEN_STATUSES))
        .order_by(CheckIn.checked_in_at, CheckIn.check_in_id)
        .all()
    )
    return sorted(rows, key=lambda c: c.status != WAITING)


# Scheduled appointments on `day` whose patient isn't checked in already.
# The day range is computed here (not with a SQL date function) so the query
# works the same on SQL Server and Postgres.
def appointments_for_day(db: Session, day: date) -> list[dict]:
    start = datetime.combine(day, time.min)
    end = start + timedelta(days=1)
    open_patients = db.query(CheckIn.patient_id).filter(CheckIn.status.in_(OPEN_STATUSES))
    checked_in_appointments = db.query(CheckIn.appointment_id).filter(CheckIn.appointment_id.isnot(None))

    rows = (
        db.query(Appointment, Patient, Provider)
        .join(Patient, Patient.patient_id == Appointment.patient_id)
        .outerjoin(Provider, Provider.provider_id == Appointment.provider_id)
        .filter(
            Appointment.status == "scheduled",
            Appointment.appointment_datetime >= start,
            Appointment.appointment_datetime < end,
            Appointment.patient_id.notin_(open_patients),
            Appointment.appointment_id.notin_(checked_in_appointments),
        )
        .order_by(Appointment.appointment_datetime)
        .all()
    )
    return [
        {
            "appointment_id": appt.appointment_id,
            "patient_id": patient.patient_id,
            "patient_name": _name(patient),
            "mrn": patient.mrn,
            "appointment_time": appt.appointment_datetime,
            "location": appt.location,
            "provider_name": f"{provider.first_name} {provider.last_name}" if provider else None,
        }
        for appt, patient, provider in rows
    ]


def check_in(db: Session, patient_id: int, appointment_id: int | None, staff_id: int | None) -> CheckIn:
    if db.query(Patient).filter(Patient.patient_id == patient_id).first() is None:
        raise CheckInError(404, "Patient not found")

    already = (
        db.query(CheckIn)
        .filter(CheckIn.patient_id == patient_id, CheckIn.status.in_(OPEN_STATUSES))
        .first()
    )
    if already is not None:
        raise CheckInError(409, "This patient is already checked in")

    # A patient already in a room (assigned before check-ins existed) can't be checked in again
    in_room = (
        db.query(RoomAssignment)
        .filter(RoomAssignment.patient_id == patient_id, RoomAssignment.discharged_at.is_(None))
        .first()
    )
    if in_room is not None:
        raise CheckInError(409, "This patient is already in a room")

    if appointment_id is not None:
        appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
        if appointment is None or appointment.patient_id != patient_id:
            raise CheckInError(404, "Appointment not found for this patient")
        if appointment.status != "scheduled":
            raise CheckInError(409, f"This appointment is {appointment.status}")

    row = CheckIn(
        patient_id=patient_id,
        appointment_id=appointment_id,
        status=WAITING,
        checked_in_at=_now(),
        checked_in_by=staff_id,
    )
    db.add(row)
    db.commit()
    return get_check_in(db, row.check_in_id)


# Waiting -> roomed: records the room assignment and marks the room occupied
def assign_room(db: Session, check_in_id: int, room_id: int) -> CheckIn:
    row = get_check_in(db, check_in_id)
    if row.status != WAITING:
        raise CheckInError(409, "Only a waiting patient can be put in a room")

    room = db.query(Room).filter(Room.room_id == room_id).first()
    if room is None:
        raise CheckInError(404, "Room not found")
    if room.status != "available":
        raise CheckInError(409, f"Room {room.room_number} is not available")

    assignment = RoomAssignment(room_id=room.room_id, patient_id=row.patient_id, assigned_at=_now())
    db.add(assignment)
    db.flush()
    room.status = "occupied"
    row.room_assignment_id = assignment.assignment_id
    row.status = ROOMED
    db.commit()
    db.expire_all()
    return get_check_in(db, row.check_in_id)


# Roomed -> done: frees the room and completes the appointment, if there is one
def discharge(db: Session, check_in_id: int) -> CheckIn:
    row = get_check_in(db, check_in_id)
    if row.status != ROOMED:
        raise CheckInError(409, "Only a patient in a room can be discharged")

    now = _now()
    assignment = row.room_assignment
    if assignment is not None and assignment.discharged_at is None:
        assignment.discharged_at = now
        room = db.query(Room).filter(Room.room_id == assignment.room_id).first()
        if room is not None:
            room.status = "available"

    if row.appointment is not None and row.appointment.status == "scheduled":
        row.appointment.status = "completed"

    row.status = DONE
    row.checked_out_at = now
    db.commit()
    db.expire_all()
    return get_check_in(db, row.check_in_id)


# Waiting -> cancelled: the patient left before getting a room
def cancel(db: Session, check_in_id: int) -> CheckIn:
    row = get_check_in(db, check_in_id)
    if row.status != WAITING:
        raise CheckInError(409, "Only a waiting patient's check-in can be cancelled")
    row.status = CANCELLED
    row.checked_out_at = _now()
    db.commit()
    db.expire_all()
    return get_check_in(db, row.check_in_id)
