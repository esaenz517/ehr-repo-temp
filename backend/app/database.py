import os
from urllib.parse import quote_plus

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# DB connection settings, pulled from docker-compose env vars (with local defaults).
DB_SERVER = os.getenv("DB_SERVER", "db")
DB_PORT = os.getenv("DB_PORT", "1433")
DB_NAME = os.getenv("DB_NAME", "AppDb")
DB_USER = os.getenv("DB_USER", "sa")
DB_PASSWORD = os.getenv("DB_PASSWORD", "YourStrong!Passw0rd")

# The local container uses a self-signed certificate, so skip the check by default.
# Azure SQL has a real certificate, so Render sets DB_TRUST_CERT=no to verify it.
DB_TRUST_CERT = os.getenv("DB_TRUST_CERT", "yes")

# Seconds to wait for a login. Azure SQL serverless can take up to a minute to wake
# from auto-pause, so Render raises this to 60.
DB_LOGIN_TIMEOUT = int(os.getenv("DB_LOGIN_TIMEOUT", "15"))

# SQLAlchemy connection URL (still uses the ODBC driver under the hood via pyodbc).
DATABASE_URL = (
    f"mssql+pyodbc://{quote_plus(DB_USER)}:{quote_plus(DB_PASSWORD)}"
    f"@{DB_SERVER}:{DB_PORT}/{DB_NAME}"
    f"?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate={DB_TRUST_CERT}"
)

# Engine manages the pool of DB connections; created once at import time.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # drop dead connections after a DB restart (or Azure idle disconnect)
    connect_args={"timeout": DB_LOGIN_TIMEOUT},
)

# Session factory - each request gets its own Session from this.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class all ORM models (see models.py) inherit from.
Base = declarative_base()


# FastAPI dependency: yields a DB session per request, closes it afterward.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
