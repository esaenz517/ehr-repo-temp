"""
Portal Accounts Router
Staff endpoints for a patient's portal account: see whether one exists, and
create one. Disabling or re-enabling it uses PATCH /users/{user_id}/status.

Account management needs the same permissions as the users API
(user.read to look, user.create to create).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud import patients as patient_crud
from app.crud import portal_accounts as crud
from app.database import get_db
from app.schemas.portal_accounts import PortalAccount, PortalAccountCreate, PortalAccountCreated
from app.security.authorization import require_permission

router = APIRouter(prefix="/patients/{patient_id}/portal-account", tags=["portal accounts"])


def _patient_or_404(db: Session, patient_id: int):
    patient = patient_crud.get_patient(db, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


# null when the patient has no portal account yet
@router.get("", response_model=PortalAccount | None)
def get_portal_account(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user", "read")),
):
    return crud.get_account(db, _patient_or_404(db, patient_id))


@router.post("", response_model=PortalAccountCreated, status_code=201)
def create_portal_account(
    patient_id: int,
    data: PortalAccountCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user", "create")),
):
    patient = _patient_or_404(db, patient_id)
    try:
        return crud.create_account(db, patient, data)
    except crud.PortalAccountError as error:
        raise HTTPException(status_code=error.status_code, detail=str(error))
    except IntegrityError:
        # Someone else took the email or username between the check and the insert
        db.rollback()
        raise HTTPException(status_code=409, detail="That email or username is already in use")
