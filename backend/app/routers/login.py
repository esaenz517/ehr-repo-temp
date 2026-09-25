'''
Login Router
This file defines API endpoints for managing logins with username and password. 
'''

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import login as crud
from app.database import get_db
from app.schemas.login import LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user =  crud.check_login(db, request.username, request.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return user
