import os
from urllib.parse import quote_plus

from sqlalchemy import URL, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql.elements import quoted_name

# Which database to talk to: "mssql" (SQL Server: local Docker and the Azure SQL
# backup) or "postgres" (Supabase). Everything below depends on it.
DB_DIALECT = os.getenv("DB_DIALECT", "mssql").lower()
IS_POSTGRES = DB_DIALECT in ("postgres", "postgresql")

# DB connection settings, pulled from docker-compose / Render env vars (with local defaults).
DB_SERVER = os.getenv("DB_SERVER", "db")
DB_PORT = os.getenv("DB_PORT", "5432" if IS_POSTGRES else "1433")
DB_NAME = os.getenv("DB_NAME", "postgres" if IS_POSTGRES else "AppDb")
DB_USER = os.getenv("DB_USER", "postgres" if IS_POSTGRES else "sa")
DB_PASSWORD = os.getenv("DB_PASSWORD", "YourStrong!Passw0rd")

# SQL Server only. The local container uses a self-signed certificate, so skip the
# check by default. Azure SQL has a real certificate, so Render sets DB_TRUST_CERT=no.
DB_TRUST_CERT = os.getenv("DB_TRUST_CERT", "yes")

# Postgres only. Supabase requires SSL; a local Postgres container has none, so set
# DB_SSLMODE=disable there.
DB_SSLMODE = os.getenv("DB_SSLMODE", "require")

# Seconds to wait for a login. Azure SQL serverless can take up to a minute to wake
# from auto-pause, so Render raises this to 60.
DB_LOGIN_TIMEOUT = int(os.getenv("DB_LOGIN_TIMEOUT", "15"))

if IS_POSTGRES:
    # psycopg (v3) driver, e.g. the Supabase session pooler on port 5432.
    DATABASE_URL = URL.create(
        "postgresql+psycopg",
        username=DB_USER,
        password=DB_PASSWORD,
        host=DB_SERVER,
        port=int(DB_PORT),
        database=DB_NAME,
        query={"sslmode": DB_SSLMODE},
    )
    connect_args = {"connect_timeout": DB_LOGIN_TIMEOUT}
else:
    # SQL Server through the Microsoft ODBC driver (pyodbc).
    DATABASE_URL = (
        f"mssql+pyodbc://{quote_plus(DB_USER)}:{quote_plus(DB_PASSWORD)}"
        f"@{DB_SERVER}:{DB_PORT}/{DB_NAME}"
        f"?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate={DB_TRUST_CERT}"
    )
    connect_args = {"timeout": DB_LOGIN_TIMEOUT}

# Engine manages the pool of DB connections; created once at import time.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # drop dead connections after a DB restart (or an idle disconnect)
    connect_args=connect_args,
)

# Session factory - each request gets its own Session from this.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class all ORM models (see models.py) inherit from.
Base = declarative_base()


def use_unquoted_names_on_postgres():
    """
    The models name tables and columns the SQL Server way ("Users", "UserId").
    SQLAlchemy would send those to Postgres in double quotes, which makes Postgres
    match the exact letter case. The Postgres scripts in db/postgres/ create the
    tables without quotes instead, so Postgres stores the names in lowercase and
    matches them in any case, the same way SQL Server does. Sending the names
    unquoted keeps the models identical for both databases.

    Call once, after every model is imported (main.py does this).
    """
    if not IS_POSTGRES:
        return
    for table in Base.metadata.tables.values():
        table.name = quoted_name(table.name, False)
        for column in table.columns:
            column.name = quoted_name(column.name, False)


# FastAPI dependency: yields a DB session per request, closes it afterward.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
