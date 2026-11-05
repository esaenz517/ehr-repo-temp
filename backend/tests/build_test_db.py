"""
Builds a fresh test database from the same scripts the app uses:
  * SQL Server: db/init/init.sql, with every `:r` include inlined, split on GO,
    and the AppDb name swapped for the test database name (DB_NAME).
  * Postgres: db/postgres/init.sql, with every `\\ir` include inlined.

The database named in DB_NAME is DROPPED and re-created, so it must never be a
real one: build() refuses names that don't contain "test".

Settings come from the same env vars as the app (DB_DIALECT, DB_SERVER, DB_PORT,
DB_NAME, DB_USER, DB_PASSWORD, DB_SSLMODE). DB_SCRIPTS_DIR points at the repo's
db/ folder (default: ../../db from this file, or /db inside the test container).
"""

import os
import re
from pathlib import Path

IS_POSTGRES = os.getenv("DB_DIALECT", "mssql").lower() in ("postgres", "postgresql")

DEFAULT_SCRIPTS = Path(__file__).resolve().parents[2] / "db"
SCRIPTS_DIR = Path(os.getenv("DB_SCRIPTS_DIR", str(DEFAULT_SCRIPTS)))


def _inline(path: Path, include: re.Pattern, resolve) -> str:
    """Returns the file's text with each include line replaced by that file's text."""
    out = []
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        match = include.match(line)
        if match:
            out.append(_inline(resolve(path, match.group(1)), include, resolve))
        else:
            out.append(line)
    return "\n".join(out)


def mssql_batches(database: str) -> list[str]:
    """init.sql as a list of batches, ready to run against SQL Server."""
    init = SCRIPTS_DIR / "init" / "init.sql"
    # :r paths are container paths (/init/...), relative to db/init here
    text = _inline(
        init,
        re.compile(r"^\s*:r\s+(\S+)\s*$", re.IGNORECASE),
        lambda _, p: SCRIPTS_DIR / "init" / p.removeprefix("/init/"),
    )
    text = re.sub(r"\bAppDb\b", database, text)
    batches = re.split(r"^\s*GO\s*(?:--.*)?$", text, flags=re.IGNORECASE | re.MULTILINE)
    return [b for b in batches if b.strip()]


def postgres_script() -> str:
    """init.sql as one script, ready to run against Postgres."""
    init = SCRIPTS_DIR / "postgres" / "init.sql"
    return _inline(
        init,
        re.compile(r"^\s*\\ir\s+(\S+)\s*$"),
        lambda parent, p: (parent.parent / p).resolve(),
    )


def _build_mssql(database: str) -> None:
    import pyodbc

    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 18 for SQL Server};"
        f"SERVER={os.getenv('DB_SERVER', 'db')},{os.getenv('DB_PORT', '1433')};"
        f"DATABASE=master;UID={os.getenv('DB_USER', 'sa')};PWD={os.getenv('DB_PASSWORD', '')};"
        "TrustServerCertificate=yes",
        autocommit=True,
    )
    cursor = conn.cursor()
    cursor.execute(
        f"IF DB_ID(N'{database}') IS NOT NULL BEGIN "
        f"ALTER DATABASE [{database}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; "
        f"DROP DATABASE [{database}]; END"
    )
    for number, batch in enumerate(mssql_batches(database), start=1):
        try:
            cursor.execute(batch)
            # Errors in later statements of a batch only surface while reading results
            while cursor.nextset():
                pass
        except pyodbc.Error as error:
            raise RuntimeError(f"init.sql batch {number} failed:\n{batch[:500]}") from error
    conn.close()


def _build_postgres(database: str) -> None:
    import psycopg

    params = dict(
        host=os.getenv("DB_SERVER", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
        sslmode=os.getenv("DB_SSLMODE", "disable"),
    )
    with psycopg.connect(dbname="postgres", autocommit=True, **params) as conn:
        conn.execute(f'DROP DATABASE IF EXISTS "{database}" WITH (FORCE)')
        conn.execute(f'CREATE DATABASE "{database}"')

    # One transaction, like psql --single-transaction
    with psycopg.connect(dbname=database, **params) as conn:
        conn.execute(postgres_script())


def build() -> None:
    database = os.getenv("DB_NAME", "")
    if "test" not in database.lower():
        raise RuntimeError(
            f"Refusing to rebuild database {database!r}: the test database name must contain 'test'"
        )
    if IS_POSTGRES:
        _build_postgres(database)
    else:
        _build_mssql(database)


if __name__ == "__main__":
    build()
    print(f"Built test database {os.getenv('DB_NAME')}")
