"""Regression tests for request security and patient record ownership."""

import pytest
from fastapi.testclient import TestClient

from app.security.request_protection import validate_production_settings
from tests.conftest import sign_in


def test_api_security_headers(anon):
    response = anon.get("/health")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "no-referrer"


def test_authenticated_write_requires_header(admin):
    response = admin.post(
        "/auth/logout",
        headers={"X-EHR-Request": ""},
    )

    assert response.status_code == 403
    assert admin.get("/auth/me").status_code == 200


def test_authenticated_write_rejects_untrusted_origin(admin):
    response = admin.post(
        "/auth/logout",
        headers={"Origin": "https://untrusted.example"},
    )

    assert response.status_code == 403
    assert admin.get("/auth/me").status_code == 200


def test_password_failures_are_limited(anon, unique):
    username = f"missing-{unique}"

    for _ in range(10):
        response = anon.post(
            "/auth/login",
            json={"username": username, "password": "incorrect"},
        )
        assert response.status_code == 401

    response = anon.post(
        "/auth/login",
        json={"username": username, "password": "incorrect"},
    )
    assert response.status_code == 429


def test_production_rejects_insecure_configuration(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("COOKIE_SECURE", "false")

    with pytest.raises(RuntimeError, match="COOKIE_SECURE"):
        validate_production_settings()


def test_disabled_account_cannot_sign_in(api, admin):
    existing = sign_in(api, "jacob")
    staff_id = existing.me["staffid"]

    user_id = admin.get(f"/staff/{staff_id}").json()["user_id"]

    assert (
        admin.patch(
            f"/users/{user_id}/status",
            json={"account_status": "disabled"},
        ).status_code
        == 200
    )

    try:
        response = TestClient(api).post(
            "/auth/login",
            json={"username": "jacob", "password": "jacob"},
        )

        assert response.status_code == 403
        assert existing.get("/auth/me").status_code == 403

    finally:
        admin.patch(
            f"/users/{user_id}/status",
            json={"account_status": "active"},
        )


def test_medical_history_delete_checks_patient_id(admin, lookup):
    patient_one = lookup.patient("MRN000001")
    patient_two = lookup.patient("MRN000002")

    path = f"/patients/{patient_one}/medical-history"

    created = admin.post(
        path,
        json={"condition": "Security regression test"},
    )
    assert created.status_code == 201

    record_id = created.json()["medical_history_id"]

    try:
        response = admin.delete(f"/patients/{patient_two}/medical-history/{record_id}")
        assert response.status_code == 404

        records = admin.get(path).json()
        assert any(row["medical_history_id"] == record_id for row in records)

    finally:
        assert admin.delete(f"{path}/{record_id}").status_code == 204


def test_family_history_delete_checks_patient_id(admin, lookup):
    patient_one = lookup.patient("MRN000001")
    patient_two = lookup.patient("MRN000002")

    path = f"/patients/{patient_one}/family-history"

    created = admin.post(
        path,
        json={
            "relationship": "Parent",
            "condition": "Security regression test",
        },
    )
    assert created.status_code == 201

    record_id = created.json()["family_history_id"]

    try:
        response = admin.delete(f"/patients/{patient_two}/family-history/{record_id}")
        assert response.status_code == 404

        records = admin.get(path).json()
        assert any(row["family_history_id"] == record_id for row in records)

    finally:
        assert admin.delete(f"{path}/{record_id}").status_code == 204
