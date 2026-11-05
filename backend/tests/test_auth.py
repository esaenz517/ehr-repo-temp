"""Signing in and out, sessions, and what /auth/me reports for each role."""

from tests.conftest import sign_in


def test_health(anon):
    assert anon.get("/health").json() == {"status": "ok"}
    assert anon.get("/health/db").json()["database"] == "ok"


def test_wrong_password_is_rejected(anon):
    response = anon.post("/auth/login", json={"username": "admin", "password": "nope"})
    assert response.status_code == 401


def test_unknown_user_is_rejected(anon):
    response = anon.post("/auth/login", json={"username": "nobody", "password": "x"})
    assert response.status_code == 401


def test_endpoints_need_a_session(anon):
    assert anon.get("/auth/me").status_code == 401
    assert anon.get("/patients").status_code == 401
    assert anon.get("/departments").status_code == 401


def test_username_is_case_insensitive(api):
    client = sign_in(api, "ADMIN", "admin123")
    assert client.me["username"] == "admin"


def test_admin_profile(admin):
    me = admin.get("/auth/me").json()
    assert me["role"] == "ADMIN"
    assert me["admin"] is True and me["student"] is False
    assert me["first_name"] == "Jordan"
    # Admins oversee every department
    assert me["department_id"] is None
    assert "user.manage_roles" in me["permissions"]
    assert "department.manage" in me["permissions"]


def test_instructor_profile(instructor):
    me = instructor.get("/auth/me").json()
    assert me["role"] == "FACULTY_INSTRUCTOR"
    assert me["admin"] is False and me["student"] is False
    assert me["department_code"] == "NURS"
    assert me["discipline_name"] == "Nursing"
    assert "assignment.manage" in me["permissions"]
    assert "user.manage_roles" not in me["permissions"]


def test_student_profile(ana):
    me = ana.get("/auth/me").json()
    assert me["role"] == "STUDENT"
    assert me["student"] is True
    assert me["department_code"] == "PHAR"
    assert me["discipline_name"] == "Pharmacy"
    assert "note.create.general" in me["permissions"]
    assert "staff.read" not in me["permissions"]


def test_logout_ends_the_session(api):
    client = sign_in(api, "luis")
    assert client.get("/auth/me").status_code == 200
    assert client.post("/auth/logout").status_code == 204
    assert client.get("/auth/me").status_code == 401


def test_a_disabled_account_is_locked_out(api, admin):
    client = sign_in(api, "jacob")
    user_id = admin.get(f"/staff/{client.me['staffid']}").json()["user_id"]

    assert admin.patch(f"/users/{user_id}/status", json={"account_status": "disabled"}).status_code == 200
    try:
        # Still signed in, but every permission check needs an active account
        assert client.get("/patients").status_code == 403
    finally:
        admin.patch(f"/users/{user_id}/status", json={"account_status": "active"})

    assert client.get("/patients").status_code == 200


def test_admin_cannot_disable_themselves(admin):
    user_id = admin.get(f"/staff/{admin.me['staffid']}").json()["user_id"]
    response = admin.patch(f"/users/{user_id}/status", json={"account_status": "disabled"})
    assert response.status_code == 400
