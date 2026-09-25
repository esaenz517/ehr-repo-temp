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


# Shape of the data the API returns.
class LoginResponse(BaseModel):
    username: str
    staffid: int

    class Config:
        from_attributes = True
