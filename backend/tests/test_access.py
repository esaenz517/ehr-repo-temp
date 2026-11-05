"""
Who can reach what: one row per endpoint, the expected status for each role.
200 = allowed, 403 = signed in but not permitted.
Admins hold every permission; instructors manage cases and the clinical catalog;
students read what they need for their assignments.
"""

import pytest

# (path, admin, instructor, student)
READ_MATRIX = [
    ("/patients",               200, 200, 200),
    ("/cases",                  200, 200, 200),
    ("/drugs",                  200, 200, 200),
    ("/providers",              200, 200, 403),
    ("/rooms",                  200, 200, 403),
    ("/staff",                  200, 200, 403),
    ("/courses",                200, 200, 403),
    ("/courses/mine",           200, 200, 200),
    ("/departments",            200, 200, 200),
    ("/disciplines",            200, 200, 200),
    ("/users",                  200, 403, 403),
    ("/roles",                  200, 403, 403),
    ("/permissions",            200, 403, 403),
    ("/grades/student",         200, 200, 200),
    ("/grades/instructor",      200, 200, 200),
]


@pytest.mark.parametrize("path, as_admin, as_instructor, as_student", READ_MATRIX)
def test_read_access(admin, instructor, student, path, as_admin, as_instructor, as_student):
    assert admin.get(path).status_code == as_admin, f"admin {path}"
    assert instructor.get(path).status_code == as_instructor, f"instructor {path}"
    assert student.get(path).status_code == as_student, f"student {path}"


def test_students_cannot_manage_people_or_courses(student, lookup):
    student_role = lookup.role("STUDENT")
    nurs = lookup.department("NURS")

    assert student.post("/staff", json={"first_name": "X", "last_name": "Y", "role_id": student_role}).status_code == 403
    assert student.post("/users", json={"email": "x@example.test", "password": "x"}).status_code == 403
    assert student.post("/departments", json={"code": "ZZ", "name": "Z"}).status_code == 403
    assert student.post(
        "/courses",
        json={"subject_code": "NURS", "course_number": "1", "title": "T", "term": "Fall", "term_year": 2026, "department_id": nurs},
    ).status_code == 403
    assert student.post("/staff/student", json={
        "first_name": "A", "last_name": "B", "discipline": "NURSE", "email": "ab@example.test",
    }).status_code == 403


def test_instructors_cannot_change_roles_or_departments(instructor, student, lookup):
    admin_role = lookup.role("ADMIN")
    assert instructor.put(f"/staff/{student.me['staffid']}/role/{admin_role}").status_code == 403
    assert instructor.post("/departments", json={"code": "ZZ", "name": "Z"}).status_code == 403
    assert instructor.post("/disciplines", json={"code": "ZZ", "name": "Z"}).status_code == 403
    assert instructor.post("/staff", json={"first_name": "X", "last_name": "Y", "role_id": admin_role}).status_code == 403


def test_students_only_see_their_own_assignments(student, ana):
    assert student.get(f"/assignments/student/{student.me['staffid']}").status_code == 200
    assert student.get(f"/assignments/student/{ana.me['staffid']}").status_code == 403


def test_instructors_only_list_their_own_assigned_work(instructor, pharmacy):
    assert instructor.get(f"/assignments/assigned-by/{instructor.me['staffid']}").status_code == 200
    assert instructor.get(f"/assignments/assigned-by/{pharmacy.me['staffid']}").status_code == 403


def test_a_student_cannot_open_another_students_assignment(student, ana):
    other = ana.get(f"/assignments/student/{ana.me['staffid']}").json()[0]
    assert student.get(f"/assignments/{other['assignment_id']}/note").status_code == 403
    assert student.post(f"/assignments/{other['assignment_id']}/start").status_code == 403
