'''
Login Schemas
Request/response shapes for the login request API - separate from the DB model (models/login.py)
because what a client sends/receives doesn't always match what's stored.
'''

from pydantic import BaseModel

# What front end sends to log in.
class LoginRequest(BaseModel):
    username: str
    password: str


# Shape of the signed-in user the API returns from /auth/login and /auth/me.
# roles and permissions let the frontend decide which views to show; the
# backend still checks permissions on every request.
class LoginResponse(BaseModel):
    username: str
    staffid: int
    userid: int
    name: str
    roles: list[str]
    permissions: list[str]
