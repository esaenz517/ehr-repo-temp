import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

<<<<<<< HEAD
from app.routers import (
    login,
    drugs,
    items,
    patients,
    permissions,
    providers,
    roles,
    rooms,
    staff,
    users,
)
=======
from app.routers import drugs, medical_history, items, patients, providers, staff
>>>>>>> 3e7527a (Complete medical and family history feature)

app = FastAPI(title="Simple Items API")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items.router)
app.include_router(patients.router)
app.include_router(providers.router)
app.include_router(drugs.router)
app.include_router(staff.router)
<<<<<<< HEAD
app.include_router(rooms.router)
app.include_router(login.router)

app.include_router(users.router)
app.include_router(roles.router)
app.include_router(permissions.router)
=======
app.include_router(medical_history.router)
>>>>>>> 3e7527a (Complete medical and family history feature)


@app.get("/health")
def health():
    return {"status": "ok"}
