"""The patient portal: patients sign in on the normal login, see only their own
record through /portal, and are kept out of the staff API."""

import pytest

from tests.conftest import sign_in

PORTAL_PATHS = [
    "/portal/me",
    "/portal/appointments",
    "/portal/billing",
    "/portal/insurance",
    "/portal/medical-history",
    "/portal/family-history",
    "/portal/medications",
    "/portal/allergies",
    "/portal/vitals",
    "/portal/lab-results",
]

# Staff endpoints a patient must not reach, including ones that only check
# that someone is signed in (departments, courses/mine, grades, deletion log).
STAFF_PATHS = [
    "/patients",
    "/patients/1",
    "/patients/1/appointments",
    "/patients/1/charges",
    "/patients/1/medical-history",
    "/patients/1/family-history",
    "/patients/1/insurance",
    "/patients/1/portal-account",
    "/cases",
    "/drugs",
    "/staff",
    "/users",
    "/departments",
    "/disciplines",
    "/courses/mine",
    "/grades/student",
    "/grades/instructor",
]


def test_patient_profile(james):
    me = james.get("/auth/me").json()
    assert me["role"] == "PATIENT"
    assert me["patientid"] is not None
    assert me["staffid"] is None
    assert me["permissions"] == []
    assert me["student"] is False and me["admin"] is False
    assert me["first_name"] == "Jim"  # preferred name
    assert me["last_name"] == "Carter"


def test_staff_profiles_have_no_patient(admin, student):
    assert admin.me["patientid"] is None
    assert student.me["patientid"] is None


@pytest.mark.parametrize("path", PORTAL_PATHS)
def test_patient_can_read_every_portal_page(james, path):
    assert james.get(path).status_code == 200, path


@pytest.mark.parametrize("path", STAFF_PATHS)
def test_patient_is_kept_out_of_the_staff_api(james, path):
    assert james.get(path).status_code == 403, path


@pytest.mark.parametrize("path", PORTAL_PATHS)
def test_staff_cannot_use_the_portal(admin, student, path):
    assert admin.get(path).status_code == 403, path
    assert student.get(path).status_code == 403, path


def test_portal_needs_a_session(anon):
    assert anon.get("/portal/me").status_code == 401


def test_portal_shows_only_the_patients_own_record(james, admin, lookup):
    patient_id = lookup.patient("MRN000001")
    assert james.me["patientid"] == patient_id

    profile = james.get("/portal/me").json()
    assert profile["mrn"] == "MRN000001"
    assert profile["provider"] is not None

    # Same rows the staff API shows for this patient, and only those
    staff_view = admin.get(f"/patients/{patient_id}/appointments").json()
    portal = james.get("/portal/appointments").json()
    assert {a["appointment_id"] for a in portal} == {a["appointment_id"] for a in staff_view}
    assert all(a["provider_name"].startswith("Dr. ") for a in portal)

    charges = admin.get(f"/patients/{patient_id}/charges").json()
    billing = james.get("/portal/billing").json()
    assert {c["charge_id"] for c in billing["charges"]} == {c["charge_id"] for c in charges}
    assert float(billing["total"]) == pytest.approx(sum(float(c["charge_amount"]) for c in charges))

    history = admin.get(f"/patients/{patient_id}/medical-history").json()
    assert {h["condition"] for h in james.get("/portal/medical-history").json()} == {h["condition"] for h in history}

    family = admin.get(f"/patients/{patient_id}/family-history").json()
    assert {f["condition"] for f in james.get("/portal/family-history").json()} == {f["condition"] for f in family}


def test_portal_responses_hide_internal_ids(james):
    assert "patient_id" not in james.get("/portal/me").json()
    for appointment in james.get("/portal/appointments").json():
        assert "patient_id" not in appointment and "provider_id" not in appointment


def test_admin_creates_a_portal_account(api, admin, lookup, unique):
    patient_id = lookup.patient("MRN000006")
    path = f"/patients/{patient_id}/portal-account"
    assert admin.get(path).json() is None

    email = f"aisha.{unique}@example.test"
    created = admin.post(path, json={"email": email, "username": f"aisha{unique}"})
    assert created.status_code == 201, created.text
    account = created.json()
    assert account["username"] == f"aisha{unique}"
    assert account["account_status"] == "active"
    assert account["temporary_password"]  # generated, shown once

    assert admin.get(path).json()["user_id"] == account["user_id"]
    # One account per patient
    assert admin.post(path, json={"email": f"other.{unique}@example.test"}).status_code == 409

    # The new login lands in the portal for this patient
    patient = sign_in(api, f"aisha{unique}", account["temporary_password"])
    assert patient.me["role"] == "PATIENT"
    assert patient.me["patientid"] == patient_id
    assert patient.get("/portal/me").json()["mrn"] == "MRN000006"

    # Disabling the account (users API) locks the patient out of the portal
    assert admin.patch(f"/users/{account['user_id']}/status", json={"account_status": "disabled"}).status_code == 200
    assert patient.get("/portal/me").status_code == 403


def test_portal_account_rejects_taken_email_and_bad_input(admin, lookup):
    path = f"/patients/{lookup.patient('MRN000004')}/portal-account"
    assert admin.post(path, json={"email": "admin@example.local"}).status_code == 409
    assert admin.post(path, json={"email": "not-an-email"}).status_code == 400
    assert admin.post(path, json={"email": "ok@example.test", "username": "has space"}).status_code == 400
    assert admin.post("/patients/999999/portal-account", json={"email": "x@example.test"}).status_code == 404


def test_only_account_managers_create_portal_accounts(instructor, student, lookup):
    path = f"/patients/{lookup.patient('MRN000004')}/portal-account"
    assert instructor.post(path, json={"email": "x@example.test"}).status_code == 403
    assert student.post(path, json={"email": "x@example.test"}).status_code == 403
    assert instructor.get(path).status_code == 403
