import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.routers import (
    appointments,
    drugs,
    login,
    medical_history,
    patients,
    permissions,
    providers,
    roles,
    rooms,
    staff,
    users,
    medical_history,
    assignment,
    billing,
    insurance,
    clinical_notes,
    cases,
    courses,
    batch_students,
    grades_progress,
    rubric,
    deletion_audit,
    departments,
    disciplines,
    portal,
    portal_accounts,
    note_templates,
    note_access_log,
)
from app.security.deletion_audit_middleware import deletion_audit_middleware
from app.security.note_access_middleware import note_access_middleware
from app.security.request_protection import (
    request_protection_middleware,
    validate_production_settings,
)
from app.database import get_db, use_unquoted_names_on_postgres
from app.security.current_user import reject_patient_accounts

# Every model is imported by now (through the routers above).
use_unquoted_names_on_postgres()
validate_production_settings()

production = os.getenv("APP_ENV", "development").lower() == "production"

app = FastAPI(
    title="EHR API",
    docs_url=None if production else "/docs",
    redoc_url=None if production else "/redoc",
    openapi_url=None if production else "/openapi.json",
)

origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Validate authenticated writes and protect API responses.
app.middleware("http")(request_protection_middleware)

# Log delete requests, including requests denied by request protection.
app.middleware("http")(deletion_audit_middleware)

# Log every request on a clinical note (views, changes and refused attempts) to
# dbo.NoteAccessLog; admins read it at GET /audit/note-access
app.middleware("http")(note_access_middleware)

# Patient portal accounts may only use /auth and /portal. Every other router
# turns them away (403), on top of each endpoint's own permission check.
STAFF_ONLY = [Depends(reject_patient_accounts)]

app.include_router(patients.router, dependencies=STAFF_ONLY)
app.include_router(providers.router, dependencies=STAFF_ONLY)
app.include_router(drugs.router, dependencies=STAFF_ONLY)
app.include_router(staff.router, dependencies=STAFF_ONLY)
app.include_router(batch_students.router, dependencies=STAFF_ONLY)
app.include_router(grades_progress.router, dependencies=STAFF_ONLY)
app.include_router(login.router)
app.include_router(medical_history.router, dependencies=STAFF_ONLY)
app.include_router(rooms.router, dependencies=STAFF_ONLY)
app.include_router(appointments.router, dependencies=STAFF_ONLY)
app.include_router(billing.router, dependencies=STAFF_ONLY)
app.include_router(insurance.router, dependencies=STAFF_ONLY)
app.include_router(cases.router, dependencies=STAFF_ONLY)
app.include_router(courses.router, dependencies=STAFF_ONLY)
app.include_router(departments.router, dependencies=STAFF_ONLY)
app.include_router(disciplines.router, dependencies=STAFF_ONLY)

app.include_router(users.router, dependencies=STAFF_ONLY)
app.include_router(roles.router, dependencies=STAFF_ONLY)
app.include_router(permissions.router, dependencies=STAFF_ONLY)
app.include_router(assignment.router, dependencies=STAFF_ONLY)
app.include_router(rubric.router, dependencies=STAFF_ONLY)

app.include_router(clinical_notes.router, dependencies=STAFF_ONLY)
app.include_router(deletion_audit.router, dependencies=STAFF_ONLY)
app.include_router(note_templates.router, dependencies=STAFF_ONLY)
app.include_router(note_access_log.router, dependencies=STAFF_ONLY)

# Patient portal: a signed-in patient's own record (read-only)
app.include_router(portal.router)
app.include_router(portal_accounts.router, dependencies=STAFF_ONLY)


@app.get("/health")
def health():
    return {"status": "ok"}


# Same as /health, but also runs a tiny query, so it fails if the database is
# unreachable (/health never touches the database).
@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}
