"""
Patient Portal CRUD
Read-only queries for the patient portal that the staff CRUD modules don't
already provide. Every function takes the patient id from the caller, which
routers/portal.py always gets from the signed-in session.

Appointments are returned with the provider's name, and medications with the
drug name, so the portal doesn't need the staff-only provider and drug APIs.
"""

from sqlalchemy.orm import Session

from app.models.appointments import Appointment
from app.models.clinical_notes import PatientAllergy, PatientLabResult, PatientVital
from app.models.drugs import Drug
from app.models.patients import patient_drugs
from app.models.providers import Provider


def list_appointments(db: Session, patient_id: int) -> list[dict]:
    rows = (
        db.query(Appointment, Provider)
        .outerjoin(Provider, Provider.provider_id == Appointment.provider_id)
        .filter(Appointment.patient_id == patient_id)
        .order_by(Appointment.appointment_datetime)
        .all()
    )

    return [
        {
            "appointment_id": appointment.appointment_id,
            "appointment_datetime": appointment.appointment_datetime,
            "location": appointment.location,
            "status": appointment.status,
            "provider_name": f"Dr. {provider.first_name} {provider.last_name}" if provider else None,
            "provider_specialty": provider.specialty if provider else None,
        }
        for appointment, provider in rows
    ]


def list_medications(db: Session, patient_id: int) -> list[dict]:
    rows = (
        db.query(
            Drug.drug_id,
            Drug.name,
            patient_drugs.c.Dosage,
            patient_drugs.c.Route,
            patient_drugs.c.Frequency,
        )
        .join(patient_drugs, patient_drugs.c.DrugId == Drug.drug_id)
        .filter(patient_drugs.c.PatientId == patient_id)
        .order_by(Drug.name)
        .all()
    )

    return [
        {"drug_id": drug_id, "name": name, "dosage": dosage, "route": route, "frequency": frequency}
        for drug_id, name, dosage, route, frequency in rows
    ]


def list_allergies(db: Session, patient_id: int):
    return (
        db.query(PatientAllergy)
        .filter(PatientAllergy.patient_id == patient_id)
        .order_by(PatientAllergy.substance)
        .all()
    )


# Newest first: the portal shows the latest reading at the top.
def list_vitals(db: Session, patient_id: int):
    return (
        db.query(PatientVital)
        .filter(PatientVital.patient_id == patient_id)
        .order_by(PatientVital.recorded_at.desc())
        .all()
    )


def list_lab_results(db: Session, patient_id: int):
    return (
        db.query(PatientLabResult)
        .filter(PatientLabResult.patient_id == patient_id)
        .order_by(PatientLabResult.collected_at.desc(), PatientLabResult.test_name)
        .all()
    )
