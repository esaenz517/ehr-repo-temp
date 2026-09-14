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

# SQLAlchemy connection URL (still uses the ODBC driver under the hood via pyodbc).
DATABASE_URL = (
    f"mssql+pyodbc://{quote_plus(DB_USER)}:{quote_plus(DB_PASSWORD)}"
    f"@{DB_SERVER}:{DB_PORT}/{DB_NAME}"
    "?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes"
)

# Engine manages the pool of DB connections; created once at import time.
engine = create_engine(DATABASE_URL)

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
