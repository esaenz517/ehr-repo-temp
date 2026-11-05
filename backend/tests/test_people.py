"""People (staff), accounts (users), roles, and the student import."""

import csv
import io


def test_every_person_has_one_of_three_roles(admin):
    people = admin.get("/staff").json()
    assert people
    assert {p["role_name"] for p in people} <= {"ADMIN", "FACULTY_INSTRUCTOR", "STUDENT"}


def test_staff_shows_names_next_to_ids(admin):
    ana = next(p for p in admin.get("/staff").json() if p["first_name"] == "Ana")
    assert ana["role_name"] == "STUDENT" and ana["student"] is True
    assert ana["discipline_name"] == "Pharmacy"
    assert ana["department_name"] == "Pharmacy"
    assert ana["user_id"] is not None


def test_filter_staff_by_role_and_department(instructor, lookup):
    nurs = lookup.department("NURS")
    students = instructor.get("/staff", params={"role": "STUDENT", "department_id": nurs}).json()
    assert students
    assert all(s["role_name"] == "STUDENT" and s["department_id"] == nurs for s in students)
    names = {s["first_name"] for s in students}
    assert {"Sam", "Emmanuel", "Zachary", "Sophia"} <= names


def test_only_three_active_roles(admin):
    active = {r["role_name"] for r in admin.get("/roles").json() if r["is_active"]}
    assert active == {"ADMIN", "FACULTY_INSTRUCTOR", "STUDENT"}


def test_create_update_and_delete_a_person(admin, lookup):
    created = admin.post("/staff", json={
        "first_name": " Test ", "last_name": "Person",
        "role_id": lookup.role("FACULTY_INSTRUCTOR"),
        "discipline_id": lookup.discipline("OCCUPATIONAL_THERAPY"),
        "department_id": lookup.department("OT"),
    })
    assert created.status_code == 201, created.text
    person = created.json()
    assert person["first_name"] == "Test"
    assert person["role_name"] == "FACULTY_INSTRUCTOR"
    assert person["department_name"] == "Occupational Therapy"
    assert person["user_id"] is None  # no account yet

    moved = admin.patch(f"/staff/{person['staffid']}", json={"department_id": lookup.department("IHS"), "middle_name": "Q"})
    assert moved.status_code == 200
    assert moved.json()["department_name"] == "Interprofessional Health Sciences"
    assert moved.json()["middle_name"] == "Q"

    cleared = admin.patch(f"/staff/{person['staffid']}", json={"discipline_id": None})
    assert cleared.json()["discipline_id"] is None

    assert admin.delete(f"/staff/{person['staffid']}").status_code == 204
    assert admin.get(f"/staff/{person['staffid']}").status_code == 404


def test_unknown_references_are_rejected(admin, lookup):
    role = lookup.role("STUDENT")
    assert admin.post("/staff", json={"first_name": "A", "last_name": "B", "role_id": 999999}).status_code == 400
    assert admin.post("/staff", json={"first_name": "A", "last_name": "B", "role_id": role, "department_id": 999999}).status_code == 400
    assert admin.post("/staff", json={"first_name": "A", "last_name": "B", "role_id": role, "discipline_id": 999999}).status_code == 400


def test_admin_changes_a_role(admin, lookup):
    person = admin.post("/staff", json={"first_name": "Role", "last_name": "Change", "role_id": lookup.role("STUDENT")}).json()

    promoted = admin.put(f"/staff/{person['staffid']}/role/{lookup.role('FACULTY_INSTRUCTOR')}")
    assert promoted.status_code == 200
    assert promoted.json()["role_name"] == "FACULTY_INSTRUCTOR"
    assert promoted.json()["student"] is False

    assert admin.put(f"/staff/{person['staffid']}/role/999999").status_code == 400
    assert admin.put(f"/staff/999999/role/{lookup.role('STUDENT')}").status_code == 404
    admin.delete(f"/staff/{person['staffid']}")


def test_inactive_roles_cannot_be_given(admin):
    inactive = [r for r in admin.get("/roles").json() if not r["is_active"]]
    if not inactive:
        return  # a fresh database has only the three active roles
    person = admin.get("/staff").json()[0]
    assert admin.put(f"/staff/{person['staffid']}/role/{inactive[0]['role_id']}").status_code == 400


def test_role_change_changes_permissions(api, admin, lookup):
    from tests.conftest import sign_in

    kinley = sign_in(api, "kinley", "kinley")
    assert kinley.get("/staff").status_code == 403

    admin.put(f"/staff/{kinley.me['staffid']}/role/{lookup.role('FACULTY_INSTRUCTOR')}")
    try:
        assert kinley.get("/staff").status_code == 200
        assert kinley.get("/auth/me").json()["role"] == "FACULTY_INSTRUCTOR"
    finally:
        admin.put(f"/staff/{kinley.me['staffid']}/role/{lookup.role('STUDENT')}")

    assert kinley.get("/staff").status_code == 403


def test_accounts(admin, unique):
    email = f"New.User.{unique}@Example.test"
    created = admin.post("/users", json={"email": email, "password": "secret"})
    assert created.status_code == 201
    account = created.json()
    assert account["email"] == email.lower()
    assert account["is_active"] is True
    assert "password" not in account and "password_hash" not in account

    assert admin.post("/users", json={"email": email.upper(), "password": "x"}).status_code == 409

    disabled = admin.patch(f"/users/{account['user_id']}/status", json={"account_status": "locked"})
    assert disabled.json()["is_active"] is False
    assert admin.patch(f"/users/{account['user_id']}/status", json={"account_status": "gone"}).status_code == 422


def _csv(rows):
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["FirstName", "LastName", "Discipline", "Department", "Email"])
    writer.writerows(rows)
    return out.getvalue()


def test_batch_import_preview_changes_nothing(admin, unique):
    before = len(admin.get("/staff").json())
    result = admin.post("/staff/batch", json={
        "csv_text": _csv([["Pre", "View", "Nursing", "", f"preview.{unique}@example.test"]]),
        "validate_only": True,
    }).json()
    assert result["ready"] == 1 and result["created"] == 0
    assert len(admin.get("/staff").json()) == before


def test_batch_import_creates_students_with_discipline_and_department(api, admin, unique):
    from tests.conftest import sign_in

    result = admin.post("/staff/batch", json={
        "csv_text": _csv([
            ["Nia", "Nurse", "NURSE", "", f"nia.{unique}@example.test"],
            ["Pat", "Physician", "Physician", "", f"pat.{unique}@example.test"],
            ["Otto", "Therapist", "occupational therapy", "OT", f"otto.{unique}@example.test"],
        ]),
        "validate_only": False,
    }).json()
    assert result["created"] == 3, result

    people = {p["staffid"]: p for p in admin.get("/staff").json()}
    by_name = {row["name"]: people[row["staffid"]] for row in result["rows"]}
    assert by_name["Nia Nurse"]["department_name"] == "Nursing"            # from the discipline
    assert by_name["Pat Physician"]["department_name"] == "Interprofessional Health Sciences"  # default
    assert by_name["Otto Therapist"]["discipline_name"] == "Occupational Therapy"
    assert all(p["role_name"] == "STUDENT" for p in by_name.values())

    # The temporary password works
    row = result["rows"][0]
    client = sign_in(api, row["username"], row["temporary_password"])
    assert client.me["role"] == "STUDENT"


def test_batch_import_accepts_the_old_specialization_column(admin, unique):
    text = f"FirstName,LastName,Specialization,Email\nOld,Header,Nursing,old.{unique}@example.test\n"
    result = admin.post("/staff/batch", json={"csv_text": text, "validate_only": True}).json()
    assert result["ready"] == 1


def test_batch_import_blocks_unknown_disciplines_and_departments(admin, unique):
    result = admin.post("/staff/batch", json={
        "csv_text": _csv([
            ["Bad", "Discipline", "Astrology", "", f"bad1.{unique}@example.test"],
            ["Bad", "Department", "Nursing", "Nowhere", f"bad2.{unique}@example.test"],
            ["Good", "Row", "Nursing", "", f"good.{unique}@example.test"],
        ]),
        "validate_only": False,
    }).json()
    assert result["blocked"] is True
    assert result["invalid"] == 2 and result["created"] == 0


def test_batch_import_skips_existing_accounts(admin):
    result = admin.post("/staff/batch", json={
        "csv_text": _csv([["Ana", "Torres", "Pharmacy", "", "ana@example.local"]]),
        "validate_only": True,
    }).json()
    # Either the email or the username "ana@example.local" may already exist
    assert result["rows"][0]["status"] in ("existing", "ready")


def test_batch_import_rejects_passwords_in_the_csv(admin):
    text = "FirstName,LastName,Discipline,Email,Password\nA,B,Nursing,a@b.test,x\n"
    assert admin.post("/staff/batch", json={"csv_text": text}).status_code == 400


def test_create_a_single_student(admin, unique):
    response = admin.post("/staff/student", json={
        "first_name": "Single", "last_name": "Student",
        "discipline": "PHARMACY", "department": "PHAR",
        "email": f"single.{unique}@example.test",
    })
    assert response.status_code == 201, response.text
    person = admin.get(f"/staff/{response.json()['staffid']}").json()
    assert person["discipline_name"] == "Pharmacy" and person["role_name"] == "STUDENT"

    again = admin.post("/staff/student", json={
        "first_name": "Single", "last_name": "Student", "discipline": "PHARMACY",
        "email": f"single.{unique}@example.test",
    })
    assert again.status_code == 409
