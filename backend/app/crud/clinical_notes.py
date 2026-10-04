"""Read-only chart context and atomic versioned note writes."""

import json
from datetime import datetime, timezone

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.models.clinical_notes import (
    ClinicalNote,
    Encounter,
    NoteVersion,
    PatientAllergy,
    PatientLabResult,
    PatientVital,
)
from app.models.drugs import Drug
from app.models.medical_history import FamilyHistory, MedicalHistory
from app.models.patients import patient_drugs
from app.schemas.clinical_notes import SoapContent


def snapshot(content: SoapContent) -> str:
    return content.model_dump_json()


def note_data(note: ClinicalNote) -> dict:
    return {
        key: (json.loads(value) if key == "content" else value)
        for key, value in vars(note).items()
        if not key.startswith("_")
    }


def version_data(version: NoteVersion) -> dict:
    return {
        key: (json.loads(value) if key == "content_snapshot" else value)
        for key, value in vars(version).items()
        if not key.startswith("_")
    }


def get_chart_context(db: Session, patient_id: int) -> dict:
    medical = (
        db.query(MedicalHistory)
        .filter_by(patient_id=patient_id)
        .order_by(MedicalHistory.medical_history_id)
        .all()
    )

    family = (
        db.query(FamilyHistory)
        .filter_by(patient_id=patient_id)
        .order_by(FamilyHistory.family_history_id)
        .all()
    )

    meds = (
        db.query(
            Drug,
            patient_drugs.c.Dosage,
            patient_drugs.c.Route,
            patient_drugs.c.Frequency,
        )
        .join(
            patient_drugs,
            patient_drugs.c.DrugId == Drug.drug_id,
        )
        .filter(patient_drugs.c.PatientId == patient_id)
        .order_by(Drug.name)
        .all()
    )

    allergies = (
        db.query(PatientAllergy)
        .filter_by(patient_id=patient_id)
        .order_by(PatientAllergy.allergy_id)
        .all()
    )

    vitals = (
        db.query(PatientVital)
        .filter_by(patient_id=patient_id)
        .order_by(
            PatientVital.recorded_at.desc(),
            PatientVital.vital_id.desc(),
        )
        .first()
    )

    labs = (
        db.query(PatientLabResult)
        .filter_by(patient_id=patient_id)
        .order_by(
            PatientLabResult.collected_at.desc(),
            PatientLabResult.lab_result_id.desc(),
        )
        .limit(10)
        .all()
    )

    return {
        "medical_history": [
            {
                "condition": x.condition,
                "diagnosis_date": (
                    x.diagnosis_date.isoformat() if x.diagnosis_date else None
                ),
                "notes": x.notes,
            }
            for x in medical
        ],
        "family_history": [
            {
                "relationship": x.relationship,
                "condition": x.condition,
                "notes": x.notes,
            }
            for x in family
        ],
        "medications": [
            {
                "drug_id": drug.drug_id,
                "name": drug.name,
                "dosage": dosage,
                "route": route,
                "frequency": frequency,
            }
            for drug, dosage, route, frequency in meds
        ],
        "allergies": [
            {
                "substance": x.substance,
                "reaction": x.reaction,
            }
            for x in allergies
        ],
        "latest_vitals": (
            {
                "recorded_at": vitals.recorded_at,
                "blood_pressure": vitals.blood_pressure,
                "heart_rate": vitals.heart_rate,
                "respiratory_rate": vitals.respiratory_rate,
                "temperature_c": vitals.temperature_c,
                "oxygen_saturation": vitals.oxygen_saturation,
                "height_cm": vitals.height_cm,
                "weight_kg": vitals.weight_kg,
            }
            if vitals
            else None
        ),
        "recent_labs": [
            {
                "test_name": x.test_name,
                "result": x.result,
                "unit": x.unit,
                "flag": x.flag,
                "collected_at": x.collected_at,
            }
            for x in labs
        ],
    }


def create_note(
    db: Session,
    *,
    patient_id: int,
    encounter_id: int,
    provider_id: int | None,
    author_id: int,
    discipline: str | None,
    sensitivity: str,
    content: SoapContent,
) -> ClinicalNote:
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    note = ClinicalNote(
        patient_id=patient_id,
        encounter_id=encounter_id,
        note_type="SOAP",
        responsible_provider_id=provider_id,
        author_user_id=author_id,
        discipline=discipline,
        sensitivity_classification=sensitivity,
        created_at=now,
        last_modified_at=now,
        content=snapshot(content),
        current_version=1,
        is_archived=False,
    )

    db.add(note)
    db.flush()

    db.add(
        NoteVersion(
            note_id=note.note_id,
            version_number=1,
            content_snapshot=note.content,
            author_user_id=author_id,
            created_at=now,
            change_summary="Initial draft",
        )
    )

    db.commit()
    db.refresh(note)

    return note


def update_note(
    db: Session,
    note: ClinicalNote,
    *,
    expected_version: int,
    content: SoapContent,
    author_id: int,
    summary: str | None,
) -> ClinicalNote | None:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    new_content = snapshot(content)

    # Compare-and-swap prevents simultaneous editors from
    # overwriting one another.
    result = db.execute(
        update(ClinicalNote)
        .where(
            ClinicalNote.note_id == note.note_id,
            ClinicalNote.current_version == expected_version,
            ClinicalNote.is_archived == False,
        )
        .values(
            content=new_content,
            current_version=expected_version + 1,
            last_modified_at=now,
        )
    )

    if result.rowcount != 1:
        db.rollback()
        return None

    db.add(
        NoteVersion(
            note_id=note.note_id,
            version_number=expected_version + 1,
            content_snapshot=new_content,
            author_user_id=author_id,
            created_at=now,
            change_summary=summary,
        )
    )

    db.commit()
    db.refresh(note)

    return note
