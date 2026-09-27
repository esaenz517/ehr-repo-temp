"""SOAP is the only editable template this sprint; persisted metadata supports future types."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class SoapContent(BaseModel):
    chief_complaint: str = ""
    hpi: str = ""
    past_medical_history: str = ""
    past_surgical_history: str = ""
    family_history: str = ""
    social_history: str = ""
    physical_exam: str = ""
    assessment: str = ""
    plan: str = ""


class NoteCreate(BaseModel):
    patient_id: int
    encounter_id: int
    note_type: Literal["SOAP"] = "SOAP"
    responsible_provider_id: int | None = None
    sensitivity_classification: Literal["general", "restricted"] = "general"
    content: SoapContent


class NoteUpdate(BaseModel):
    expected_version: int = Field(ge=1)
    content: SoapContent
    change_summary: str | None = Field(default=None, max_length=500)


class NoteOut(BaseModel):
    note_id: int
    patient_id: int
    encounter_id: int
    note_type: str
    discipline: str | None
    author_user_id: int
    responsible_provider_id: int | None
    created_at: datetime
    last_modified_at: datetime
    content: SoapContent
    sensitivity_classification: str
    current_version: int
    is_archived: bool


class VersionOut(BaseModel):
    version_id: int
    note_id: int
    version_number: int
    content_snapshot: SoapContent
    author_user_id: int
    created_at: datetime
    change_summary: str | None


class EncounterOut(BaseModel):
    encounter_id: int
    patient_id: int
    started_at: datetime

    model_config = {"from_attributes": True}


class ChartContext(BaseModel):
    medical_history: list[dict]
    family_history: list[dict]
    medications: list[dict]
    allergies: list[dict]
    latest_vitals: dict | None
    recent_labs: list[dict]
