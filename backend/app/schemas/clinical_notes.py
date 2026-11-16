"""Clinical note shapes. Content is a dict of the note type's fields; which
fields are allowed is set by the type's template (app/note_templates.py) and
checked in the router, so new note types need no schema change here."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

# SOAP's fields, kept for reference and older imports. Notes now carry
# NoteContent; the SOAP template in app/note_templates.py is the source of truth.
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

# A note's fields, e.g. {"chief_complaint": "...", "plan": "..."}
NoteContent = dict[str, Any]

class NoteCreate(BaseModel):
    patient_id: int
    encounter_id: int
   # Must be an enabled type in app/note_templates.py (checked in the router)
    note_type: str = Field(default="SOAP", max_length=100)
    responsible_provider_id: int | None = None
    sensitivity_classification: Literal["general", "restricted"] = "general"
    content: NoteContent


class NoteUpdate(BaseModel):
    expected_version: int = Field(ge=1)
    content: NoteContent
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
    content: NoteContent
    sensitivity_classification: str
    current_version: int
    is_archived: bool


class VersionOut(BaseModel):
    version_id: int
    note_id: int
    version_number: int
    content_snapshot: NoteContent
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
