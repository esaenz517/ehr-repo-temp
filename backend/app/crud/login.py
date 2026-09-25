'''
Login CRUD
DB access functions for Login - get & verify credentials & hash passwords
'''

import bcrypt
from sqlalchemy.orm import Session

from app.models.login import Login as LoginModel

def check_login(db: Session, username, password):
    username = username.strip().lower()
    user = db.query(LoginModel).filter(LoginModel.username == username).first()
    if user is None: # Username does not exist in db
        return None
    try:
        if bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8")):
            return user
    except ValueError:
        return None
    return None # Incorrect PW

def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")