from decimal import Decimal

from pydantic import BaseModel


class BillingChargeBase(BaseModel):
    charge_summary: str
    charge_amount: Decimal


class BillingChargeCreate(BillingChargeBase):
    pass


class BillingCharge(BillingChargeBase):
    charge_id: int
    patient_id: int

    class Config:
        from_attributes = True


class BillingChargeUpdate(BaseModel):
    charge_summary: str
    charge_amount: Decimal