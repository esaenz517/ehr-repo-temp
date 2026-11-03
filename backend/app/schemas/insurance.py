
from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class InsuranceBase(BaseModel):
    insurance_company: str = Field(min_length=1, max_length=150)
    member_id: str = Field(min_length=1, max_length=100)
    group_number: str | None = Field(default=None, max_length=100)

    policyholder_name: str = Field(min_length=1, max_length=200)
    policyholder_date_of_birth: date | None = None

    insurance_priority: Literal["primary", "secondary"]

    coverage_start_date: date | None = None
    coverage_end_date: date | None = None

    @model_validator(mode="after")
    def validate_coverage_dates(self):
        if (
            self.coverage_start_date is not None
            and self.coverage_end_date is not None
            and self.coverage_end_date < self.coverage_start_date
        ):
            raise ValueError(
                "Coverage end date cannot be before coverage start date."
            )
        return self


class InsuranceCreate(InsuranceBase):
    pass


class InsuranceUpdate(InsuranceBase):
    pass


class InsuranceResponse(InsuranceBase):
    model_config = ConfigDict(from_attributes=True)

    insurance_id: int
    patient_id: int
    verification_status: Literal[
        "unverified",
        "verified_active",
        "verified_inactive",
        "unable_to_verify",
    ]
