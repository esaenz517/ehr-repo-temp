# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A minimal three-tier reference app: React + TypeScript frontend (Vite, served by nginx), Python FastAPI backend (SQLAlchemy + pyodbc), and SQL Server, each in its own Docker container wired together by `docker-compose.yml`. It currently implements a single `items` resource end-to-end and is meant to be copied as a template for new resources.

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
No test suite or linter is configured for the backend.

**Frontend, without Docker:**
```bash
cd frontend
npm install
npm run dev     # Vite dev server
npm run build   # tsc -b && vite build
npm run preview
```
No test suite or linter is configured for the frontend beyond the TypeScript compiler run as part of `build`.

**Database:** `db-init` waits for SQL Server's healthcheck then runs `db/init/init.sql`, which creates the `AppDb` database, the `dev` login/user (used by the backend and CloudBeaver instead of `sa`), the `dbo.Items` table, and two seed rows. Connect via SSMS or CloudBeaver at `localhost,1433` (or host `db` from inside the compose network), user `dev`, password `dev123`.

## Architecture

### Backend: one resource = four matching files

Each backend feature lives across four directories, all named after the resource (e.g. `items.py` in each):

```
backend/app/
├── main.py         # creates the FastAPI app, registers routers, CORS, /health
├── database.py     # engine/session setup, Base, get_db() dependency
├── models/<resource>.py    # SQLAlchemy ORM class mapped to an existing DB table
├── schemas/<resource>.py   # Pydantic request/response shapes (separate from the ORM model)
├── crud/<resource>.py      # DB query functions, take a Session and return ORM objects
└── routers/<resource>.py   # APIRouter endpoints, call crud, use schemas for I/O
```

To add a new resource: create the table in `db/init/init.sql` first (models describe tables that must already exist in SQL Server — they don't create them), then add matching `models/`, `schemas/`, `crud/`, `routers/` files following `items.py` as the template in each, and register the new router in `main.py` (`app.include_router(...)`).

DB config (`DB_SERVER`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) and CORS origins (`CORS_ORIGINS`) come from env vars set in `docker-compose.yml`, with local defaults in `database.py`/`main.py`.

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
