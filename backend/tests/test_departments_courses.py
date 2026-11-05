"""Departments, disciplines, courses, and course enrollments."""


def test_seeded_departments_and_disciplines(student):
    departments = {d["code"]: d for d in student.get("/departments").json()}
    assert {"PHAR", "NURS", "PT", "OT", "IHS"} <= set(departments)

    disciplines = {d["code"]: d for d in student.get("/disciplines").json()}
    assert disciplines["NURSE"]["department_id"] == departments["NURS"]["department_id"]
    assert disciplines["PHYSICIAN"]["department_id"] is None


def test_disciplines_filter_by_department(student, lookup):
    pt = lookup.department("PT")
    codes = {d["code"] for d in student.get("/disciplines", params={"department_id": pt}).json()}
    assert codes == {"PHYSICAL_THERAPY"}


def test_admin_manages_departments(admin, unique):
    code = ("T" + unique[:5]).lower()
    created = admin.post("/departments", json={"code": code, "name": "Test Department"})
    assert created.status_code == 201
    department = created.json()
    assert department["code"] == code.upper()

    assert admin.post("/departments", json={"code": code.upper(), "name": "Again"}).status_code == 409

    retired = admin.patch(f"/departments/{department['department_id']}", json={"is_active": False}).json()
    assert retired["is_active"] is False
    active_codes = {d["code"] for d in admin.get("/departments", params={"is_active": True}).json()}
    assert code.upper() not in active_codes

    assert admin.get("/departments/999999").status_code == 404


def test_admin_manages_disciplines(admin, lookup, unique):
    created = admin.post("/disciplines", json={
        "code": f"speech {unique}", "name": f"Speech Therapy {unique}", "department_id": lookup.department("IHS"),
    })
    assert created.status_code == 201
    discipline = created.json()
    assert discipline["code"] == f"SPEECH_{unique}".upper()

    assert admin.post("/disciplines", json={"code": "x" + unique, "name": f"speech therapy {unique}"}).status_code == 409
    assert admin.post("/disciplines", json={"code": "y" + unique, "name": "Y", "department_id": 999999}).status_code == 400

    unlinked = admin.patch(f"/disciplines/{discipline['discipline_id']}", json={"department_id": None}).json()
    assert unlinked["department_id"] is None


def test_courses_belong_to_a_department(instructor):
    courses = instructor.get("/courses").json()
    assert courses and all(c["department_id"] and c["department_name"] for c in courses)
    pharmacy = next(c for c in courses if c["subject_code"] == "PHAR" and c["course_number"] == "5310" and c["term_year"] == 2026 and c["term"] == "Fall")
    assert pharmacy["department_name"] == "Pharmacy"
    assert pharmacy["short_label"] == "PHAR 5310"


def test_filter_courses(instructor, lookup):
    phar = lookup.department("PHAR")
    courses = instructor.get("/courses", params={"department_id": phar}).json()
    assert courses and all(c["department_id"] == phar for c in courses)
    inactive = instructor.get("/courses", params={"is_active": False}).json()
    assert all(not c["is_active"] for c in inactive)
    assert any(c["subject_code"] == "PHAR" and c["term"] == "Spring" for c in inactive)


def test_create_and_update_a_course(instructor, lookup, unique):
    body = {
        "subject_code": "NURS", "course_number": unique[:6], "title": "Test Course",
        "term": "Spring", "term_year": 2027, "department_id": lookup.department("NURS"),
    }
    created = instructor.post("/courses", json=body)
    assert created.status_code == 201, created.text
    course = created.json()
    assert course["department_name"] == "Nursing"
    assert instructor.post("/courses", json=body).status_code == 409
    assert instructor.post("/courses", json={**body, "course_number": "x1", "department_id": 999999}).status_code == 400

    moved = instructor.patch(f"/courses/{course['course_id']}", json={"department_id": lookup.department("IHS"), "is_active": False})
    assert moved.json()["department_name"] == "Interprofessional Health Sciences"
    assert moved.json()["is_active"] is False
    assert instructor.patch(f"/courses/{course['course_id']}", json={"department_id": 999999}).status_code == 400


def test_enrollments(instructor, lookup, admin):
    course_id = lookup.course("NURS", "3310")
    people = {(p["first_name"], p["last_name"]): p for p in instructor.get(f"/courses/{course_id}/enrollments").json()}
    assert ("Sam", "Student") in people and ("Daniel", "Mejia") in people
    assert ("Ana", "Torres") not in people

    ana = lookup.staff("Ana", "Torres")
    assert instructor.post(f"/courses/{course_id}/enrollments/{ana['staffid']}").status_code == 204
    assert instructor.post(f"/courses/{course_id}/enrollments/{ana['staffid']}").status_code == 204  # already in: fine
    assert any(p["staffid"] == ana["staffid"] for p in instructor.get(f"/courses/{course_id}/enrollments").json())

    assert instructor.delete(f"/courses/{course_id}/enrollments/{ana['staffid']}").status_code == 204
    assert instructor.delete(f"/courses/{course_id}/enrollments/{ana['staffid']}").status_code == 404

    assert instructor.post(f"/courses/999999/enrollments/{ana['staffid']}").status_code == 404
    assert instructor.post(f"/courses/{course_id}/enrollments/999999").status_code == 404


def test_my_courses(ana, pharmacy, admin):
    mine = {c["short_label"] for c in ana.get("/courses/mine").json()}
    assert {"PHAR 5310", "IHS 5100", "PHAR 6150"} <= mine
    assert "NURS 3310" not in mine

    taught = {c["short_label"] for c in pharmacy.get("/courses/mine").json()}
    assert {"PHAR 5310", "PHAR 5320", "PHAR 6150", "IHS 5100"} <= taught

    assert admin.get("/courses/mine").json() == []  # admins are not enrolled anywhere
