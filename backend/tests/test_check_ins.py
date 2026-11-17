"""
Front desk: check patients in, put them in rooms, discharge them (/front-desk).
"""

import uuid
from datetime import date

import pytest


def new_patient(client, first="Desk"):
    response = client.post("/patients", json={
        "mrn": f"H{uuid.uuid4().hex[:8]}",
        "first_name": first, "last_name": "Walkin",
        "date_of_birth": "1985-03-02",
        "gender_at_birth": "male", "gender_identity": "male", "pronouns": "he/him",
        "status": "outpatient",
    })
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture
def free_room(admin, unique):
    number = 7000 + int(unique[:4], 16) % 999
    response = admin.post("/rooms", json={"room_number": number, "unit": "Front Desk Test"})
    assert response.status_code in (200, 201), response.text
    return response.json()


def test_front_desk_signs_in_with_its_role(frontdesk):
    assert frontdesk.me["role"] == "FRONT_DESK"
    assert {"checkin.read", "checkin.create", "checkin.update", "room.read", "patient.create"} <= set(frontdesk.me["permissions"])
    assert "room.update" not in frontdesk.me["permissions"]


def test_walk_in_to_room_to_discharge(frontdesk, free_room):
    patient = new_patient(frontdesk)  # the front desk registers new patients

    created = frontdesk.post("/front-desk/check-ins", json={"patient_id": patient["patient_id"]})
    assert created.status_code == 201, created.text
    check_in = created.json()
    assert check_in["status"] == "waiting"
    assert check_in["appointment_id"] is None
    assert any(c["check_in_id"] == check_in["check_in_id"] for c in frontdesk.get("/front-desk/queue").json())

    # Checked in twice -> conflict
    assert frontdesk.post("/front-desk/check-ins", json={"patient_id": patient["patient_id"]}).status_code == 409

    roomed = frontdesk.post(f"/front-desk/check-ins/{check_in['check_in_id']}/room", json={"room_id": free_room["room_id"]})
    assert roomed.status_code == 200, roomed.text
    assert roomed.json()["status"] == "roomed"
    assert roomed.json()["room_number"] == free_room["room_number"]
    assert frontdesk.get(f"/rooms/{free_room['room_id']}").json()["status"] == "occupied"

    # Can't be roomed again, can't be cancelled once in a room
    assert frontdesk.post(f"/front-desk/check-ins/{check_in['check_in_id']}/room", json={"room_id": free_room["room_id"]}).status_code == 409
    assert frontdesk.post(f"/front-desk/check-ins/{check_in['check_in_id']}/cancel").status_code == 409

    done = frontdesk.post(f"/front-desk/check-ins/{check_in['check_in_id']}/discharge")
    assert done.status_code == 200
    assert done.json()["status"] == "done"
    assert frontdesk.get(f"/rooms/{free_room['room_id']}").json()["status"] == "available"
    assert all(c["check_in_id"] != check_in["check_in_id"] for c in frontdesk.get("/front-desk/queue").json())


def test_occupied_room_is_refused(frontdesk, free_room):
    first = frontdesk.post("/front-desk/check-ins", json={"patient_id": new_patient(frontdesk, "First")["patient_id"]}).json()
    second = frontdesk.post("/front-desk/check-ins", json={"patient_id": new_patient(frontdesk, "Second")["patient_id"]}).json()
    assert frontdesk.post(f"/front-desk/check-ins/{first['check_in_id']}/room", json={"room_id": free_room["room_id"]}).status_code == 200
    assert frontdesk.post(f"/front-desk/check-ins/{second['check_in_id']}/room", json={"room_id": free_room["room_id"]}).status_code == 409

    # Cleanup: free the room, and the second patient leaves
    frontdesk.post(f"/front-desk/check-ins/{first['check_in_id']}/discharge")
    assert frontdesk.post(f"/front-desk/check-ins/{second['check_in_id']}/cancel").json()["status"] == "cancelled"


def test_appointment_check_in_completes_the_appointment(frontdesk, admin, free_room):
    patient = new_patient(frontdesk, "Booked")
    provider_id = admin.get("/providers").json()[0]["provider_id"]
    today = date.today().isoformat()
    appointment = admin.post(f"/patients/{patient['patient_id']}/appointments", json={
        "provider_id": provider_id,
        "appointment_datetime": f"{today}T23:30:00",
        "location": "Front Desk Test Clinic",
    })
    assert appointment.status_code == 201, appointment.text
    appointment_id = appointment.json()["appointment_id"]

    listed = frontdesk.get("/front-desk/appointments", params={"day": today}).json()
    assert any(a["appointment_id"] == appointment_id for a in listed)

    check_in = frontdesk.post("/front-desk/check-ins", json={
        "patient_id": patient["patient_id"], "appointment_id": appointment_id,
    }).json()
    assert check_in["appointment_id"] == appointment_id
    # Once checked in it leaves the appointment list
    assert all(a["appointment_id"] != appointment_id for a in frontdesk.get("/front-desk/appointments", params={"day": today}).json())

    frontdesk.post(f"/front-desk/check-ins/{check_in['check_in_id']}/room", json={"room_id": free_room["room_id"]})
    frontdesk.post(f"/front-desk/check-ins/{check_in['check_in_id']}/discharge")
    appointments = admin.get(f"/patients/{patient['patient_id']}/appointments").json()
    assert next(a for a in appointments if a["appointment_id"] == appointment_id)["status"] == "completed"


def test_seeded_queue(frontdesk):
    queue = frontdesk.get("/front-desk/queue").json()
    assert any(c["mrn"] == "MRN000006" and c["status"] == "waiting" for c in queue)
    assert any(c["status"] == "roomed" and c["room_number"] == 100 for c in queue)


def test_only_front_desk_and_admin_use_the_queue(instructor, student, james, frontdesk):
    for client in (instructor, student):
        assert client.get("/front-desk/queue").status_code == 403
        assert client.post("/front-desk/check-ins", json={"patient_id": 1}).status_code == 403
    assert james.get("/front-desk/queue").status_code == 403
    # The front desk can't manage rooms or edit patients
    assert frontdesk.post("/rooms", json={"room_number": 9999}).status_code == 403
    assert frontdesk.delete("/patients/1").status_code == 403
