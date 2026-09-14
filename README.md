# Simple Three-Tier App

React + TypeScript frontend, Python FastAPI backend, SQL Server database — each running in its own Docker container, wired together with a single `docker-compose.yml`.

```
repo/
├── docker-compose.yml      # wires all the services together
│
├── frontend/               # React + TypeScript (Vite), served by nginx
│   └── src/
│       ├── App.tsx         # top-level page
│       ├── api/            # functions that call the backend (one file per resource)
│       ├── components/     # UI pieces (form, list)
│       └── hooks/          # state + data-fetching logic (one hook per resource)
│
├── backend/                # FastAPI + SQLAlchemy
│   └── app/
│       ├── main.py         # creates the app, registers routers
│       ├── database.py     # DB connection/session setup
│       ├── models/         # one file per DB table (SQLAlchemy classes)
│       ├── schemas/        # one file per resource (API request/response shapes)
│       ├── crud/           # one file per resource (DB queries)
│       └── routers/        # one file per resource (API endpoints)
│
└── db/init/                # SQL Server schema + seed data (init.sql)
```

Each backend feature is 4 matching files — `models/`, `schemas/`, `crud/`, `routers/` — named after the resource (e.g. `items.py` in each). Adding a new feature means copying that same shape.

## Prerequisites

- Docker and Docker Compose
- ~4GB RAM free for the SQL Server container (Microsoft's minimum recommendation)

## Run it

From the repo root:

```bash
docker compose up --build
```

This starts six services:

| Service      | Container         | Port                      |
|--------------|--------------------|---------------------------|
| `db`         | `app-db`           | `1433` (SQL Server)       |
| `db-init`    | `app-db-init`      | — (one-shot, runs init.sql, then exits) |
| `backend`    | `app-backend`      | `8000` (FastAPI)          |
| `frontend`   | `app-frontend`     | `3000` (nginx serving the built React app) |
| `cloudbeaver`| `app-cloudbeaver`  | `8081` (web-based DB GUI) |
| `urls`       | `app-urls`         | — (one-shot, prints service URLs, then exits) |

Once everything is up:

- Frontend: http://localhost:3000
- Backend docs (Swagger UI): http://localhost:8000/docs
- Backend health check: http://localhost:8000/health
- CloudBeaver (DB GUI): http://localhost:8081

The `db-init` container waits for SQL Server's healthcheck to pass, then runs `db/init/init.sql`, which creates the `AppDb` database, an `Items` table, and two seed rows. It exits once done — that's expected, it's not meant to stay running.

## Connecting with SSMS

Open SQL Server Management Studio and connect to:

- **Server name:** `localhost,1433`
- **Authentication:** SQL Server Authentication
- **Login:** `dev`
- **Password:** `dev123` (set in `docker-compose.yml`/`db/init/init.sql` — change it before doing anything beyond local dev)

You'll see the `AppDb` database with a `dbo.Items` table once `db-init` has finished.

## Connecting with CloudBeaver

CloudBeaver is a web-based DB GUI, handy if you don't want to install SSMS/Azure Data Studio.

1. Open http://localhost:8081 — on first visit it prompts you to create an admin account (for the CloudBeaver UI itself, separate from the database credentials).
2. Add a new connection: **SQL Server**, host `db`, port `1433`, database `AppDb`, user `dev`, password `dev123`.
3. Its workspace (including saved connections) persists in the `cloudbeaver-data` volume, so you won't need to redo this every restart.

## Local development (without Docker)

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# You'll also need the msodbcsql18 ODBC driver installed locally — see backend/Dockerfile
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

## API

| Method | Path            | Description       |
|--------|-----------------|--------------------|
| GET    | `/items`        | List all items     |
| GET    | `/items/{id}`   | Get one item       |
| POST   | `/items`        | Create an item     |
| DELETE | `/items/{id}`   | Delete an item     |

## Notes / things to change before shipping this anywhere real

- The SA password is hardcoded in `docker-compose.yml` for convenience — move it to a `.env` file (and out of source control) for anything beyond local dev.
- CORS on the backend is locked to `http://localhost:3000` via the `CORS_ORIGINS` env var — update it for other origins.
- The frontend bakes `VITE_API_URL` in at **build** time (Vite behavior), so if you change it you need to rebuild the image, not just restart the container.
