"""The patient chart and clinical catalog: patients, providers, drugs, history,
rooms, appointments, billing, insurance, encounters, and clinical notes."""

import uuid

import pytest

SOAP = {
    "chief_complaint": "Follow-up visit",
    "hpi": "Feeling better.",
    "past_medical_history": "", "past_surgical_history": "", "family_history": "",
    "social_history": "", "physical_exam": "Normal.", "assessment": "Improving", "plan": "Continue.",
}


@pytest.fixture(scope="module")
def patient(instructor):
    response = instructor.post("/patients", json={
        "mrn": f"T{uuid.uuid4().hex[:8]}",
        "first_name": "Testy", "last_name": "Patient",
        "date_of_birth": "1990-01-15",
        "gender_at_birth": "female", "gender_identity": "female", "pronouns": "she/her",
        "status": "outpatient",
    })
    assert response.status_code == 201, response.text
    return response.json()


def test_patients(instructor, student, patient):
    assert any(p["patient_id"] == patient["patient_id"] for p in student.get("/patients").json())
    assert student.get(f"/patients/{patient['patient_id']}").json()["mrn"] == patient["mrn"]

    updated = instructor.patch(f"/patients/{patient['patient_id']}", json={"preferred_name": "Tess", "status": "inpatient"})
    assert updated.status_code == 200 and updated.json()["preferred_name"] == "Tess"

    taken = instructor.patch(f"/patients/{patient['patient_id']}", json={"mrn": "MRN000001"})
    assert taken.status_code == 409
    assert student.patch(f"/patients/{patient['patient_id']}", json={"preferred_name": "X"}).status_code == 403
    assert instructor.get("/patients/999999").status_code == 404


def test_providers(instructor, student, unique):
    created = instructor.post("/providers", json={"first_name": "Pat", "last_name": "Provider", "specialty": "Family Medicine", "email": f"p.{unique}@clinic.example"})
    assert created.status_code == 201
    provider_id = created.json()["provider_id"]
    assert instructor.patch(f"/providers/{provider_id}", json={"phone": "555-0100"}).json()["phone"] == "555-0100"
    assert student.post("/providers", json={"first_name": "A", "last_name": "B"}).status_code == 403
    assert instructor.delete(f"/providers/{provider_id}").status_code == 204
    assert instructor.get(f"/providers/{provider_id}").status_code == 404


def test_drugs(instructor, student, unique):
    created = instructor.post("/drugs", json={"name": f"Testamol {unique}", "description": "Test drug"})
    assert created.status_code == 201, created.text
    drug_id = created.json()["drug_id"]
    assert any(d["drug_id"] == drug_id for d in student.get("/drugs").json())
    assert instructor.patch(f"/drugs/{drug_id}", json={"description": "Updated"}).json()["description"] == "Updated"
    assert student.post("/drugs", json={"name": "Nope"}).status_code == 403
    assert instructor.delete(f"/drugs/{drug_id}").status_code == 204


def test_medical_and_family_history(student, instructor, admin, patient):
    pid = patient["patient_id"]
    history = student.post(f"/patients/{pid}/medical-history", json={"condition": "Asthma", "notes": "Mild"})
    assert history.status_code == 201, history.text
    family = student.post(f"/patients/{pid}/family-history", json={"relationship": "Mother", "condition": "Migraine"})
    assert family.status_code == 201, family.text

    assert any(h["condition"] == "Asthma" for h in instructor.get(f"/patients/{pid}/medical-history").json())
    assert any(f["condition"] == "Migraine" for f in instructor.get(f"/patients/{pid}/family-history").json())

    # Deleting history is an admin action
    history_id = history.json()["medical_history_id"]
    assert instructor.delete(f"/patients/{pid}/medical-history/{history_id}").status_code == 403
    assert admin.delete(f"/patients/{pid}/medical-history/{history_id}").status_code == 204


def test_rooms(instructor, student, patient, unique):
    number = 9000 + int(unique[:3], 16) % 999
    room = instructor.post("/rooms", json={"room_number": number, "unit": "Test Unit"})
    assert room.status_code in (200, 201), room.text
    room_id = room.json()["room_id"]

    assert student.get("/rooms").status_code == 403
    assert instructor.post(f"/rooms/{room_id}/assign/", json={"patient_id": patient["patient_id"]}).status_code in (200, 201)
    assert instructor.get(f"/rooms/{room_id}").json()["status"] == "occupied"
    assert instructor.post(f"/rooms/{room_id}/unassign/").status_code in (200, 204)
    assert instructor.get(f"/rooms/{room_id}").json()["status"] == "available"
    # The assignment history keeps the room
    assert instructor.delete(f"/rooms/{room_id}").status_code == 409

    empty = instructor.post("/rooms", json={"room_number": number + 1000}).json()
    assert instructor.delete(f"/rooms/{empty['room_id']}").status_code == 200
    assert instructor.get(f"/rooms/{empty['room_id']}").status_code == 404


def test_seeded_room_occupancy(instructor):
    rooms = {r["room_number"]: r for r in instructor.get("/rooms").json()}
    assert rooms[100]["status"] == "occupied"
    assert rooms[102]["status"] != "occupied"  # its patient was discharged


def test_appointments_billing_and_insurance(admin, instructor, patient):
    pid = patient["patient_id"]
    provider_id = instructor.get("/providers").json()[0]["provider_id"]

    appointment = admin.post(f"/patients/{pid}/appointments", json={
        "provider_id": provider_id, "appointment_datetime": "2026-12-03T09:00:00", "location": "Clinic A",
    })
    assert appointment.status_code == 201, appointment.text
    appointment_id = appointment.json()["appointment_id"]
    moved = admin.put(f"/patients/{pid}/appointments/{appointment_id}", json={
        "provider_id": provider_id, "appointment_datetime": "2026-12-04T09:00:00", "location": "Clinic B", "status": "scheduled",
    })
    assert moved.status_code == 200 and moved.json()["location"] == "Clinic B"
    assert admin.delete(f"/patients/{pid}/appointments/{appointment_id}").status_code == 204

    charge = instructor.post(f"/patients/{pid}/charges", json={"charge_summary": "Office visit", "charge_amount": "120.50"})
    assert charge.status_code == 201, charge.text
    charge_id = charge.json()["charge_id"]
    assert instructor.put(f"/patients/{pid}/charges/{charge_id}", json={"charge_summary": "Office visit", "charge_amount": 99}).status_code == 200
    assert float(instructor.get(f"/patients/{pid}/charges").json()[0]["charge_amount"]) == 99
    assert admin.delete(f"/patients/{pid}/charges/{charge_id}").status_code == 204

    insurance = admin.post(f"/patients/{pid}/insurance", json={
        "insurance_company": "Test Health", "member_id": "TH-1", "policyholder_name": "Testy Patient",
        "insurance_priority": "primary",
    })
    assert insurance.status_code == 201, insurance.text
    insurance_id = insurance.json()["insurance_id"]
    assert admin.get(f"/patients/{pid}/insurance").json()[0]["insurance_company"] == "Test Health"
    assert admin.delete(f"/patients/{pid}/insurance/{insurance_id}").status_code == 204


def test_seeded_billing_and_insurance(admin, lookup):
    pid = lookup.patient("MRN000005")
    assert len(admin.get(f"/patients/{pid}/charges").json()) >= 3
    priorities = {i["insurance_priority"] for i in admin.get(f"/patients/{pid}/insurance").json()}
    assert priorities == {"primary", "secondary"}
    assert len(admin.get(f"/patients/{pid}/appointments").json()) >= 1


def test_encounters_and_notes(api, admin, instructor, patient):
    from tests.conftest import sign_in

    emmanuel = sign_in(api, "emmanuel")
    pid = patient["patient_id"]

    encounter = emmanuel.post(f"/patients/{pid}/encounters")
    assert encounter.status_code == 201, encounter.text
    encounter_id = encounter.json()["encounter_id"]
    assert any(e["encounter_id"] == encounter_id for e in emmanuel.get(f"/patients/{pid}/encounters").json())

    note = emmanuel.post("/clinical-notes", json={"patient_id": pid, "encounter_id": encounter_id, "content": SOAP}).json()
    assert note["discipline"] == "Nursing"
    assert any(n["note_id"] == note["note_id"] for n in instructor.get(f"/patients/{pid}/clinical-notes").json())

    # Only the author edits a draft; corrections need approval first
    assert admin.put(f"/clinical-notes/{note['note_id']}", json={"expected_version": 1, "content": SOAP}).status_code == 403
    assert emmanuel.post(f"/clinical-notes/{note['note_id']}/addenda", json={"content": "Late entry"}).status_code == 409

    # The encounter belongs to the patient
    other = admin.get("/patients").json()[0]["patient_id"]
    wrong = emmanuel.post("/clinical-notes", json={"patient_id": other, "encounter_id": encounter_id, "content": SOAP})
    assert wrong.status_code in (404, 422)

    # Archiving needs note.archive, which students don't have
    assert emmanuel.delete(f"/clinical-notes/{note['note_id']}").status_code == 403


def test_archive_a_draft(admin, instructor, patient):
    pid = patient["patient_id"]
    encounter_id = admin.post(f"/patients/{pid}/encounters").json()["encounter_id"]
    note = admin.post("/clinical-notes", json={"patient_id": pid, "encounter_id": encounter_id, "content": SOAP}).json()

    assert admin.delete(f"/clinical-notes/{note['note_id']}").status_code in (200, 204)
    assert note["note_id"] not in [n["note_id"] for n in instructor.get(f"/patients/{pid}/clinical-notes").json()]


def test_restricted_notes_need_restricted_permission(admin, student, instructor, patient):
    pid = patient["patient_id"]
    encounter_id = admin.post(f"/patients/{pid}/encounters").json()["encounter_id"]

    created = admin.post("/clinical-notes", json={
        "patient_id": pid, "encounter_id": encounter_id, "content": SOAP, "sensitivity_classification": "restricted",
    })
    assert created.status_code == 201, created.text
    note_id = created.json()["note_id"]
    assert instructor.get(f"/clinical-notes/{note_id}").status_code == 200
    assert student.get(f"/clinical-notes/{note_id}").status_code == 403
    assert student.post("/clinical-notes", json={
        "patient_id": pid, "encounter_id": encounter_id, "content": SOAP, "sensitivity_classification": "restricted",
    }).status_code == 403


def test_addendum_on_an_approved_note(ana):
    signed = [a for a in ana.get(f"/assignments/student/{ana.me['staffid']}").json() if a["encounter_status"] == "signed"]
    assert signed, "the demo seed gives Ana a signed assignment"
    note = ana.get(f"/assignments/{signed[0]['assignment_id']}/note").json()

    before = len(ana.get(f"/clinical-notes/{note['note_id']}/addenda").json())
    assert before >= 1  # the seed adds one
    added = ana.post(f"/clinical-notes/{note['note_id']}/addenda", json={"content": "Another correction"})
    assert added.status_code == 201, added.text
    assert len(ana.get(f"/clinical-notes/{note['note_id']}/addenda").json()) == before + 1

    # An approved note itself can't change
    assert ana.put(f"/clinical-notes/{note['note_id']}", json={"expected_version": note["current_version"], "content": SOAP}).status_code == 409


def test_chart_context(student, lookup):
    response = student.get(f"/patients/{lookup.patient('MRN000001')}/chart-context")
    assert response.status_code == 200


def test_cases(instructor, student, lookup):
    cases = student.get("/cases").json()
    assert len(cases) >= 8
    assert student.post("/cases", json={
        "patient_id": lookup.patient("MRN000001"), "chief_complaint": "x", "created_by_staff_id": student.me["staffid"],
    }).status_code == 403

    created = instructor.post("/cases", json={
        "patient_id": lookup.patient("MRN000001"), "chief_complaint": "Delete me",
        "created_by_staff_id": instructor.me["staffid"],
    })
    assert created.status_code == 201
    case_id = created.json()["case_id"]
    assert instructor.get(f"/cases/{case_id}").json()["chief_complaint"] == "Delete me"
    assert instructor.delete(f"/cases/{case_id}").status_code == 204
    assert instructor.get(f"/cases/{case_id}").status_code == 404


def test_deleting_a_patient(instructor, unique):
    created = instructor.post("/patients", json={
        "mrn": f"D{unique}", "first_name": "Gone", "last_name": "Soon", "date_of_birth": "2000-02-02",
        "gender_at_birth": "male", "gender_identity": "male", "pronouns": "he/him",
    }).json()
    assert instructor.delete(f"/patients/{created['patient_id']}").status_code == 204
    assert instructor.get(f"/patients/{created['patient_id']}").status_code == 404


def test_cancelled_deletes_are_logged(admin):
    response = admin.post("/audit/deletions/cancelled", json={"path": "/patients/1", "label": "Patient"})
    assert response.status_code in (200, 201, 204)
