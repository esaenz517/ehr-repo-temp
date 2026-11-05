"""The demo data: every role can sign in and finds something on each page."""

import pytest

from tests.conftest import PASSWORDS, sign_in


@pytest.mark.parametrize("username", sorted(PASSWORDS))
def test_every_demo_login_works(api, username):
    client = sign_in(api, username)
    assert client.me["role"] in ("ADMIN", "FACULTY_INSTRUCTOR", "STUDENT")
    assert client.me["staffid"] is not None


def test_every_student_login_has_an_assignment(api, admin):
    for username in ("student", "emmanuel", "zachary", "jacob", "ana", "luis"):
        client = sign_in(api, username)
        assert client.get(f"/assignments/student/{client.me['staffid']}").json(), username


def test_every_assignment_status_is_represented(instructor, pharmacy):
    statuses = set()
    for client in (instructor, pharmacy):
        statuses |= {a["encounter_status"] for a in client.get(f"/assignments/assigned-by/{client.me['staffid']}").json()}
    assert {"not_started", "in_progress", "submitted", "signed"} <= statuses


def test_assignments_link_to_courses(pharmacy):
    rows = pharmacy.get(f"/assignments/assigned-by/{pharmacy.me['staffid']}").json()
    assert rows and all(r["course"] == "PHAR 5310" for r in rows)


def test_started_work_has_notes(ana):
    for row in ana.get(f"/assignments/student/{ana.me['staffid']}").json():
        if row["encounter_status"] in ("submitted", "signed"):
            note = ana.get(f"/assignments/{row['assignment_id']}/note").json()
            assert note is not None and note["discipline"] == "Pharmacy"


def test_published_grades_exist(ana):
    grades = ana.get("/grades/student").json()
    assert grades and grades[0]["items"]


def test_cases_have_rubrics(instructor):
    rows = instructor.get(f"/assignments/assigned-by/{instructor.me['staffid']}").json()
    seeded = [r for r in rows if r["chief_complaint"] == "Foot wound that is not healing"]
    assert seeded
    grade = instructor.get(f"/assignments/{seeded[0]['assignment_id']}/grade").json()
    assert len(grade["items"]) == 3


def test_departments_are_populated(admin):
    people = admin.get("/staff").json()
    non_admins = [p for p in people if p["role_name"] != "ADMIN"]
    assert all(p["department_id"] is not None for p in non_admins)
    assert {p["department_name"] for p in non_admins} >= {"Nursing", "Pharmacy", "Physical Therapy", "Interprofessional Health Sciences"}
