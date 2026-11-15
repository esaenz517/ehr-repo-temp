"""Request protection for the EHR API."""

import os

from fastapi import Request
from fastapi.responses import JSONResponse

from app.security.session_cookie import SESSION_COOKIE

UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
CSRF_HEADER = "X-EHR-Request"


def validate_production_settings():
    """Reject unsafe configuration when production mode is enabled."""
    if os.getenv("APP_ENV", "development").lower() != "production":
        return

    errors = []

    if os.getenv("COOKIE_SECURE", "false").lower() != "true":
        errors.append("COOKIE_SECURE must be true")

    if os.getenv("DUO_ENABLED", "false").lower() != "true":
        errors.append("DUO_ENABLED must be true")

    if os.getenv("DUO_INCLUDE_PATIENTS", "false").lower() != "true":
        errors.append("DUO_INCLUDE_PATIENTS must be true")

    origins = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "").split(",")
        if origin.strip()
    ]

    if not origins or any(
        not origin.startswith("https://") or "*" in origin for origin in origins
    ):
        errors.append("CORS_ORIGINS must list explicit HTTPS origins")

    for name in ("FRONTEND_URL", "DUO_REDIRECT_URI"):
        if not os.getenv(name, "").startswith("https://"):
            errors.append(f"{name} must use HTTPS")

    if os.getenv("DB_PASSWORD", "") in ("", "dev123", "YourStrong!Passw0rd", "test"):
        errors.append("DB_PASSWORD must be a non-demo secret")

    if os.getenv("DB_USER", "").lower() in ("", "sa", "postgres", "dev"):
        errors.append("DB_USER must be a dedicated database user")

    dialect = os.getenv("DB_DIALECT", "mssql").lower()

    if dialect in ("postgres", "postgresql"):
        if os.getenv("DB_SSLMODE", "require").lower() == "disable":
            errors.append("Postgres TLS must be enabled")
    elif dialect == "mssql":
        if os.getenv("DB_TRUST_CERT", "yes").lower() not in ("no", "false"):
            errors.append("DB_TRUST_CERT must be no")
    else:
        errors.append("Unsupported DB_DIALECT")

    if errors:
        raise RuntimeError("Unsafe production EHR settings: " + "; ".join(errors))


async def request_protection_middleware(request: Request, call_next):
    """Verify authenticated writes and prevent sensitive response caching."""
    if request.method in UNSAFE_METHODS and request.cookies.get(SESSION_COOKIE):
        if request.headers.get(CSRF_HEADER) != "1":
            response = JSONResponse(
                {"detail": "Request verification header required"},
                status_code=403,
            )
        else:
            origin = request.headers.get("origin")
            allowed_origins = {
                value.strip()
                for value in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(
                    ","
                )
                if value.strip()
            }

            if origin and origin not in allowed_origins:
                response = JSONResponse(
                    {"detail": "Untrusted request origin"},
                    status_code=403,
                )
            else:
                response = await call_next(request)
    else:
        response = await call_next(request)

    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

    if os.getenv("APP_ENV", "development").lower() == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000"

    return response
