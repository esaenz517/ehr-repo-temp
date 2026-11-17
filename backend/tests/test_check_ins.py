"""
Help desk: check patients in, put them in rooms, discharge them (/help-desk).
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
    response = admin.post("/rooms", json={"room_number": number, "unit": "Help Desk Test"})
    assert response.status_code in (200, 201), response.text
    return response.json()


def test_help_desk_signs_in_with_its_role(helpdesk):
    assert helpdesk.me["role"] == "HELP_DESK"
    assert {"checkin.read", "checkin.create", "checkin.update", "room.read", "patient.create"} <= set(helpdesk.me["permissions"])
    assert "room.update" not in helpdesk.me["permissions"]


def test_walk_in_to_room_to_discharge(helpdesk, free_room):
    patient = new_patient(helpdesk)  # the help desk registers new patients

    created = helpdesk.post("/help-desk/check-ins", json={"patient_id": patient["patient_id"]})
    assert created.status_code == 201, created.text
    check_in = created.json()
    assert check_in["status"] == "waiting"
    assert check_in["appointment_id"] is None
    assert any(c["check_in_id"] == check_in["check_in_id"] for c in helpdesk.get("/help-desk/queue").json())

    # Checked in twice -> conflict
    assert helpdesk.post("/help-desk/check-ins", json={"patient_id": patient["patient_id"]}).status_code == 409

    roomed = helpdesk.post(f"/help-desk/check-ins/{check_in['check_in_id']}/room", json={"room_id": free_room["room_id"]})
    assert roomed.status_code == 200, roomed.text
    assert roomed.json()["status"] == "roomed"
    assert roomed.json()["room_number"] == free_room["room_number"]
    assert helpdesk.get(f"/rooms/{free_room['room_id']}").json()["status"] == "occupied"

    # Can't be roomed again, can't be cancelled once in a room
    assert helpdesk.post(f"/help-desk/check-ins/{check_in['check_in_id']}/room", json={"room_id": free_room["room_id"]}).status_code == 409
    assert helpdesk.post(f"/help-desk/check-ins/{check_in['check_in_id']}/cancel").status_code == 409

    done = helpdesk.post(f"/help-desk/check-ins/{check_in['check_in_id']}/discharge")
    assert done.status_code == 200
    assert done.json()["status"] == "done"
    assert helpdesk.get(f"/rooms/{free_room['room_id']}").json()["status"] == "available"
    assert all(c["check_in_id"] != check_in["check_in_id"] for c in helpdesk.get("/help-desk/queue").json())


def test_occupied_room_is_refused(helpdesk, free_room):
    first = helpdesk.post("/help-desk/check-ins", json={"patient_id": new_patient(helpdesk, "First")["patient_id"]}).json()
    second = helpdesk.post("/help-desk/check-ins", json={"patient_id": new_patient(helpdesk, "Second")["patient_id"]}).json()
    assert helpdesk.post(f"/help-desk/check-ins/{first['check_in_id']}/room", json={"room_id": free_room["room_id"]}).status_code == 200
    assert helpdesk.post(f"/help-desk/check-ins/{second['check_in_id']}/room", json={"room_id": free_room["room_id"]}).status_code == 409

    # Cleanup: free the room, and the second patient leaves
    helpdesk.post(f"/help-desk/check-ins/{first['check_in_id']}/discharge")
    assert helpdesk.post(f"/help-desk/check-ins/{second['check_in_id']}/cancel").json()["status"] == "cancelled"


def test_appointment_check_in_completes_the_appointment(helpdesk, admin, free_room):
    patient = new_patient(helpdesk, "Booked")
    provider_id = admin.get("/providers").json()[0]["provider_id"]
    today = date.today().isoformat()
    appointment = admin.post(f"/patients/{patient['patient_id']}/appointments", json={
        "provider_id": provider_id,
        "appointment_datetime": f"{today}T23:30:00",
        "location": "Help Desk Test Clinic",
    })
    assert appointment.status_code == 201, appointment.text
    appointment_id = appointment.json()["appointment_id"]

    listed = helpdesk.get("/help-desk/appointments", params={"day": today}).json()
    assert any(a["appointment_id"] == appointment_id for a in listed)

    check_in = helpdesk.post("/help-desk/check-ins", json={
        "patient_id": patient["patient_id"], "appointment_id": appointment_id,
    }).json()
    assert check_in["appointment_id"] == appointment_id
    # Once checked in it leaves the appointment list
    assert all(a["appointment_id"] != appointment_id for a in helpdesk.get("/help-desk/appointments", params={"day": today}).json())

    helpdesk.post(f"/help-desk/check-ins/{check_in['check_in_id']}/room", json={"room_id": free_room["room_id"]})
    helpdesk.post(f"/help-desk/check-ins/{check_in['check_in_id']}/discharge")
    appointments = admin.get(f"/patients/{patient['patient_id']}/appointments").json()
    assert next(a for a in appointments if a["appointment_id"] == appointment_id)["status"] == "completed"


def test_seeded_queue(helpdesk):
    queue = helpdesk.get("/help-desk/queue").json()
    assert any(c["mrn"] == "MRN000006" and c["status"] == "waiting" for c in queue)
    assert any(c["status"] == "roomed" and c["room_number"] == 100 for c in queue)


def test_only_help_desk_and_admin_use_the_queue(instructor, student, james, helpdesk):
    for client in (instructor, student):
        assert client.get("/help-desk/queue").status_code == 403
        assert client.post("/help-desk/check-ins", json={"patient_id": 1}).status_code == 403
    assert james.get("/help-desk/queue").status_code == 403
    # The help desk can't manage rooms or edit patients
    assert helpdesk.post("/rooms", json={"room_number": 9999}).status_code == 403
    assert helpdesk.delete("/patients/1").status_code == 403
