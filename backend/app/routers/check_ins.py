"""
Help Desk Router (/help-desk)
Endpoints for the help desk portal: today's appointments, the check-in queue,
and moving a checked-in patient into a room and back out.

Patients are only put in rooms here (POST /help-desk/check-ins/{id}/room); the
Rooms page manages the rooms themselves.
"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud import check_ins as crud
from app.crud.check_ins import CheckInError
from app.database import get_db
from app.models.login import Login
from app.schemas.check_ins import CheckIn, CheckInCreate, CheckInRoom, DeskAppointment
from app.security.authorization import require_permission
from app.security.current_user import get_current_login

router = APIRouter(prefix="/help-desk", tags=["help desk"])


def _run(action):
    try:
        return crud.to_out(action())
    except CheckInError as err:
        raise HTTPException(status_code=err.status_code, detail=err.detail)


# Scheduled appointments on a day (default today) that haven't been checked in.
# The frontend sends its own local date so "today" matches the help desk's clock.
@router.get("/appointments", response_model=list[DeskAppointment])
def list_appointments(
    day: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("checkin", "read")),
):
    return crud.appointments_for_day(db, day or date.today())


# Patients checked in and not yet discharged
@router.get("/queue", response_model=list[CheckIn])
def queue(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("checkin", "read")),
):
    return [crud.to_out(c) for c in crud.open_queue(db)]


@router.post("/check-ins", response_model=CheckIn, status_code=status.HTTP_201_CREATED)
def check_in(
    body: CheckInCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("checkin", "create")),
    login: Login = Depends(get_current_login),
):
    return _run(lambda: crud.check_in(db, body.patient_id, body.appointment_id, login.staffid))


@router.post("/check-ins/{check_in_id}/room", response_model=CheckIn)
def assign_room(
    check_in_id: int,
    body: CheckInRoom,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("checkin", "update")),
):
    return _run(lambda: crud.assign_room(db, check_in_id, body.room_id))


@router.post("/check-ins/{check_in_id}/discharge", response_model=CheckIn)
def discharge(
    check_in_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("checkin", "update")),
):
    return _run(lambda: crud.discharge(db, check_in_id))


@router.post("/check-ins/{check_in_id}/cancel", response_model=CheckIn)
def cancel(
    check_in_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("checkin", "update")),
):
    return _run(lambda: crud.cancel(db, check_in_id))
