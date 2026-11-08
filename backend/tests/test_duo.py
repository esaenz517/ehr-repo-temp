"""
Duo two-factor sign-in (security/duo.py, POST /auth/login, GET /auth/duo/callback).

Duo itself is replaced by FakeDuo, so these tests never reach Duo's servers:
the code "good" passes the second factor and anything else is a denied prompt.
DUO_ENABLED is switched on per test; every other test signs in password-only.
"""

import uuid
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi.testclient import TestClient

from app.security import duo
from app.security.session_cookie import SESSION_COOKIE
from tests.conftest import PASSWORDS


class FakeDuo:
    def __init__(self, healthy=True):
        self.healthy = healthy

    def health_check(self):
        if not self.healthy:
            raise duo.DuoException("Duo is down")
        return {"stat": "OK"}

    def generate_state(self):
        return uuid.uuid4().hex + uuid.uuid4().hex

    def create_auth_url(self, username, state):
        return f"https://duo.example/oauth/v1/authorize?username={username}&state={state}"

    def exchange_authorization_code_for_2fa_result(self, duo_code, username):
        if duo_code != "good":
            raise duo.DuoException("denied")
        return {"auth_result": {"status": "allow"}, "preferred_username": username}


@pytest.fixture
def duo_on(monkeypatch):
    fake = FakeDuo()
    monkeypatch.setattr(duo, "DUO_ENABLED", True)
    monkeypatch.setattr(duo, "get_client", lambda: fake)
    return fake


def start_login(api, username="luis", password=None):
    """Password step only. Returns the client and the state from the Duo URL."""
    client = TestClient(api)
    response = client.post(
        "/auth/login",
        json={"username": username, "password": password or PASSWORDS[username]},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["duo_auth_url"].startswith("https://duo.example/")
    state = parse_qs(urlparse(body["duo_auth_url"]).query)["state"][0]
    return client, state


def callback(client, state, code="good"):
    return client.get(
        "/auth/duo/callback",
        params={"state": state, "duo_code": code},
        follow_redirects=False,
    )


def test_password_alone_does_not_sign_in(api, duo_on):
    client, _ = start_login(api)
    assert SESSION_COOKIE not in client.cookies
    assert client.get("/auth/me").status_code == 401


def test_passing_duo_signs_in(api, duo_on):
    client, state = start_login(api)
    response = callback(client, state)
    assert response.status_code == 303
    assert response.headers["location"] == duo.FRONTEND_URL
    me = client.get("/auth/me")
    assert me.status_code == 200
    assert me.json()["username"].lower() == "luis"


def test_denied_prompt_does_not_sign_in(api, duo_on):
    client, state = start_login(api)
    response = callback(client, state, code="denied")
    assert response.status_code == 303
    assert "duo_error=1" in response.headers["location"]
    assert client.get("/auth/me").status_code == 401


def test_state_works_only_once(api, duo_on):
    client, state = start_login(api)
    callback(client, state, code="denied")
    # A second try with the same state fails even with a good code
    response = callback(client, state)
    assert "duo_error=1" in response.headers["location"]
    assert client.get("/auth/me").status_code == 401


def test_callback_needs_the_browser_that_started_the_login(api, duo_on):
    _, state = start_login(api)
    other_browser = TestClient(api)
    response = callback(other_browser, state)
    assert "duo_error=1" in response.headers["location"]
    assert other_browser.get("/auth/me").status_code == 401


def test_duo_error_redirect_without_a_code(api, duo_on):
    client, state = start_login(api)
    response = client.get(
        "/auth/duo/callback",
        params={"state": state, "error": "access_denied"},
        follow_redirects=False,
    )
    assert "duo_error=1" in response.headers["location"]


def test_duo_down_fails_closed(api, duo_on):
    duo_on.healthy = False
    client = TestClient(api)
    response = client.post("/auth/login", json={"username": "luis", "password": PASSWORDS["luis"]})
    assert response.status_code == 503
    assert client.get("/auth/me").status_code == 401


def test_wrong_password_never_reaches_duo(api, duo_on):
    response = TestClient(api).post("/auth/login", json={"username": "luis", "password": "nope"})
    assert response.status_code == 401


def test_patient_portal_skips_duo_by_default(api, duo_on):
    client = TestClient(api)
    response = client.post("/auth/login", json={"username": "james", "password": "james"})
    assert response.status_code == 200
    assert response.json()["duo_auth_url"] is None
    assert client.get("/auth/me").json()["role"] == "PATIENT"
