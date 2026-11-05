"""
Shared fixtures for the API tests.

The tests run the real FastAPI app against a real, throwaway database that is
rebuilt from the init scripts (including the demo seed) at the start of the run,
so they cover the SQL scripts, the ORM models, and the endpoints together.
How to run them: see backend/tests/README.md.

Each role has a signed-in client, created once per run:
    admin       Jordan Reyes      ADMIN
    instructor  Daniel Mejia      FACULTY_INSTRUCTOR, Nursing
    pharmacy    Maria Alvarez     FACULTY_INSTRUCTOR, Pharmacy
    student     Sam Student       STUDENT, Nursing
    ana         Ana Torres        STUDENT, Pharmacy
"""

import os
import uuid

import pytest
from fastapi.testclient import TestClient

from tests import build_test_db

PASSWORDS = {
    "admin": "admin123",
    "instructor": "instructor123",
    "pharmacy": "pharmacy123",
    "therapy": "therapy123",
    "student": "student123",
    "ana": "ana",
    "luis": "luis",
    "emmanuel": "emmanuel",
    "zachary": "zachary",
    "jacob": "jacob",
}


@pytest.fixture(scope="session")
def api():
    """The FastAPI app, after the test database is (re)built."""
    if os.getenv("TEST_SKIP_DB_BUILD") != "1":
        build_test_db.build()
    from app.main import app

    return app


def sign_in(api, username: str, password: str | None = None) -> TestClient:
    client = TestClient(api)
    response = client.post(
        "/auth/login",
        json={"username": username, "password": password or PASSWORDS[username]},
    )
    assert response.status_code == 200, response.text
    client.me = response.json()  # who this client is (staffid, role, ...)
    return client


@pytest.fixture(scope="session")
def anon(api):
    return TestClient(api)


@pytest.fixture(scope="session")
def admin(api):
    return sign_in(api, "admin")


@pytest.fixture(scope="session")
def instructor(api):
    return sign_in(api, "instructor")


@pytest.fixture(scope="session")
def pharmacy(api):
    return sign_in(api, "pharmacy")


@pytest.fixture(scope="session")
def student(api):
    return sign_in(api, "student")


@pytest.fixture(scope="session")
def ana(api):
    return sign_in(api, "ana")


@pytest.fixture
def unique():
    """A short random suffix for names that must be unique (emails, codes)."""
    return uuid.uuid4().hex[:8]


@pytest.fixture(scope="session")
def lookup(admin):
    """Ids of seeded rows by stable values: roles, departments, disciplines, courses, patients."""

    class Lookup:
        def role(self, name):
            return next(r["role_id"] for r in admin.get("/roles").json() if r["role_name"] == name)

        def department(self, code):
            return next(d["department_id"] for d in admin.get("/departments").json() if d["code"] == code)

        def discipline(self, code):
            return next(d["discipline_id"] for d in admin.get("/disciplines").json() if d["code"] == code)

        def course(self, subject, number, term="Fall", year=2026):
            return next(
                c["course_id"]
                for c in admin.get("/courses").json()
                if (c["subject_code"], c["course_number"], c["term"], c["term_year"]) == (subject, number, term, year)
            )

        def patient(self, mrn):
            return next(p["patient_id"] for p in admin.get("/patients").json() if p["mrn"] == mrn)

        def staff(self, first, last):
            return next(
                s for s in admin.get("/staff").json() if (s["first_name"], s["last_name"]) == (first, last)
            )

    return Lookup()
