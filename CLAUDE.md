# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A minimal three-tier reference app: React + TypeScript frontend (Vite, served by nginx), Python FastAPI backend (SQLAlchemy + pyodbc), and SQL Server, each in its own Docker container wired together by `docker-compose.yml`. Each resource (patients, providers, cases, etc.) is implemented end-to-end following the same per-layer file pattern.

## Commands

**Run everything (Docker):**
```bash
docker compose up --build
```
Starts `db` (SQL Server), `db-init` (one-shot, runs `db/init/init.sql` then exits — expected), `backend` (FastAPI on 8000), `frontend` (nginx on 3000), `cloudbeaver` (DB GUI on 8081), and `urls` (one-shot, prints service URLs then exits).

- Frontend: http://localhost:3000
- Backend + Swagger docs: http://localhost:8000/docs
- Backend health check: http://localhost:8000/health
- CloudBeaver (DB GUI): http://localhost:8081

**Backend, without Docker:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# also requires the msodbcsql18 ODBC driver installed locally — see backend/Dockerfile for the install steps
uvicorn app.main:app --reload
```
Backend tests (pytest + FastAPI TestClient against a throwaway database rebuilt from the init scripts and demo seed on every run — `backend/tests/build_test_db.py` refuses database names without "test"):
```bash
docker compose --profile test run --rm backend-tests      # SQL Server, database AppDbTest
docker compose --profile test run --rm backend-tests-pg   # Postgres, temporary postgres:16 container
```
Signed-in clients per role (`admin`, `instructor`, `pharmacy`, `student`, `ana`, plus the patient portal account `james`) are fixtures in `backend/tests/conftest.py`. No linter is configured.

**Frontend, without Docker:**
```bash
cd frontend
npm install
npm run dev     # Vite dev server
npm run build   # tsc -b && vite build
npm run preview
npm test        # vitest unit tests (src/access.test.ts: which pages each role sees)
```
No linter is configured beyond the TypeScript compiler run as part of `build`.

**Access model:** `Users` is the account (email, password, `AccountStatus`); `Staff` is the person (name, `RoleId`, `DisciplineId`, `DepartmentId`, `UserId` → account, NULL for people without a login); `T_Login` is a username for an account (`userid`). Each person has exactly one role — `ADMIN`, `FACULTY_INSTRUCTOR`, or `STUDENT` — and RBAC (`crud/rbac.py`) joins `Staff.RoleId` → `RolePermissions`. `login.staffid` / `login.staff` (models/login.py) give the signed-in person. `CourseEnrollments` links people to course offerings; assignments with a `CourseId` only accept enrolled students. Frontend page visibility comes from the role's permission codes in `/auth/me` (`frontend/src/access.ts`).

**Patient portal:** patients sign in on the same login page. A portal account is a `Users` row linked from `Patients.UserId` (not `Staff`), so it has no role and no RBAC permissions; `/auth/me` reports `role: "PATIENT"` and `patientid`, and the frontend renders `components/Portal/PatientPortal.tsx` instead of the staff app. Patients use only the read-only `/portal/*` API (`routers/portal.py`), which takes the patient from the session via `get_current_patient` and never accepts a patient id. Every staff router is registered in `main.py` with `dependencies=STAFF_ONLY` (`reject_patient_accounts`), which returns 403 to patient accounts even on endpoints that only check sign-in; register new staff routers the same way. Staff create a portal account from a patient's "Portal access" tab (`POST /patients/{id}/portal-account`, needs `user.create`); disabling it uses `PATCH /users/{id}/status`. Demo login: `james` / `james` (James Carter, MRN000001).

**Duo two-factor:** with `DUO_ENABLED=true`, `POST /auth/login` checks the password, saves a `DuoPending` row, and returns `duo_auth_url` instead of creating a session; the frontend sends the browser to Duo's Universal Prompt, and Duo redirects to `GET /auth/duo/callback`, which checks the state (row + `ehr_duo_state` cookie), exchanges `duo_code`, then sets the session cookie and redirects to `FRONTEND_URL` (`?duo_error=1` on failure). Settings and the client are in `security/duo.py`. Staff only unless `DUO_INCLUDE_PATIENTS=true`; if Duo is unreachable, login returns 503 (fails closed). Locally the credentials come from the gitignored root `.env` (`DUO_CLIENT_ID`, `DUO_CLIENT_SECRET`, `DUO_API_HOST`); `DUO_ENABLED` defaults to false in code, so the tests sign in with a password only (`tests/test_duo.py` uses a fake Duo client).

**Schema changes:** there are no migration scripts. The table scripts create what's missing but don't reshape existing tables, so after a schema change rebuild the database from scratch (locally: `docker compose down -v` then `docker compose up --build`; Supabase: reset the database, then run `db/postgres/init.sql`).

**Database:** `db-init` waits for SQL Server's healthcheck then runs `db/init/init.sql`, which creates the `AppDb` database, the `dev` login/user (used by the backend and CloudBeaver instead of `sa`), then includes each table script in `db/init/tables/` and the demo data in `db/init/seed/` via sqlcmd `:r`. Connect via SSMS or CloudBeaver at `localhost,1433` (or host `db` from inside the compose network), user `dev`, password `dev123`.

## Architecture

### Backend: one resource = four matching files

Each backend feature lives across four directories, all named after the resource (e.g. `patients.py` in each):

```
backend/app/
├── main.py         # creates the FastAPI app, registers routers, CORS, /health
├── database.py     # engine/session setup, Base, get_db() dependency
├── models/<resource>.py    # SQLAlchemy ORM class mapped to an existing DB table
├── schemas/<resource>.py   # Pydantic request/response shapes (separate from the ORM model)
├── crud/<resource>.py      # DB query functions, take a Session and return ORM objects
└── routers/<resource>.py   # APIRouter endpoints, call crud, use schemas for I/O
```

To add a new resource: create the table in a new `db/init/tables/<Table>.sql` and add a `:r` line for it in `db/init/init.sql` first (plus the Postgres version in `db/postgres/tables/<Table>.sql` and an `\ir` line in `db/postgres/init.sql`) (models describe tables that must already exist in SQL Server — they don't create them), then add matching `models/`, `schemas/`, `crud/`, `routers/` files following an existing resource such as `patients.py` in each, and register the new router in `main.py` (`app.include_router(...)`).

DB config (`DB_SERVER`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) and CORS origins (`CORS_ORIGINS`) come from env vars set in `docker-compose.yml`, with local defaults in `database.py`/`main.py`.

### Two databases: SQL Server and Postgres

`DB_DIALECT` picks the database: `mssql` (default; local Docker and the Azure SQL backup, scripts in `db/init/`) or `postgres` (production on Supabase via Render, scripts in `db/postgres/`, plus `DB_SSLMODE`). Models keep SQL Server-style mixed-case names (`"Users"`, `"UserId"`); the Postgres scripts create them unquoted (stored lowercase), and `use_unquoted_names_on_postgres()` in `database.py` (called from `main.py`) makes SQLAlchemy send them unquoted so they match. Keep backend queries portable: no raw T-SQL, no `func.sysutcdatetime()` outside `server_default`, and compare user-typed text with `func.lower()` because Postgres is case-sensitive.

### Frontend: one resource = api + hook + components

```
frontend/src/
├── api/client.ts        # apiFetch<T>() wrapper — base URL, JSON headers, error/204 handling
├── api/<resource>.ts     # typed functions calling the backend for one resource
├── hooks/use<Resource>.ts  # state + data-fetching/mutation logic for one resource
├── components/           # presentational pieces (form, list)
└── App.tsx                # composes hook + components
```

`VITE_API_URL` is baked in at **build time** (Vite behavior) — changing it requires rebuilding the frontend image, not just restarting the container.

### Notes for anything beyond local dev

- `MSSQL_SA_PASSWORD` and the `dev`/`dev123` app credentials are hardcoded in `docker-compose.yml` / `db/init/init.sql` for local dev convenience.
- CORS is locked to `http://localhost:3000` via `CORS_ORIGINS`.
