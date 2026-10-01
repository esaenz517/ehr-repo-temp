from sqlalchemy.orm import Session

from app.models.billing import BillingCharge as BillingChargeModel
from app.schemas.billing import BillingChargeCreate, BillingChargeUpdate


def list_charges(db: Session, patient_id: int):
    return (
        db.query(BillingChargeModel)
        .filter(BillingChargeModel.patient_id == patient_id)
        .order_by(BillingChargeModel.charge_id)
        .all()
    )


def create_charge(
    db: Session,
    patient_id: int,
    charge: BillingChargeCreate,
):
    db_charge = BillingChargeModel(
        patient_id=patient_id,
        charge_summary=charge.charge_summary,
        charge_amount=charge.charge_amount,
    )

    db.add(db_charge)
    db.commit()
    db.refresh(db_charge)

    return db_charge


def update_charge(
    db: Session,
    patient_id: int,
    charge_id: int,
    charge: BillingChargeUpdate,
):
    db_charge = (
        db.query(BillingChargeModel)
        .filter(
            BillingChargeModel.charge_id == charge_id,
            BillingChargeModel.patient_id == patient_id,
        )
        .first()
    )

    if db_charge is None:
        return None

    db_charge.charge_summary = charge.charge_summary
    db_charge.charge_amount = charge.charge_amount

    db.commit()
    db.refresh(db_charge)

    return db_charge


def delete_charge(
    db: Session,
    patient_id: int,
    charge_id: int,
) -> bool:
    db_charge = (
        db.query(BillingChargeModel)
        .filter(
            BillingChargeModel.charge_id == charge_id,
            BillingChargeModel.patient_id == patient_id,
        )
        .first()
    )

    if db_charge is None:
        return False

    db.delete(db_charge)
    db.commit()

    return True