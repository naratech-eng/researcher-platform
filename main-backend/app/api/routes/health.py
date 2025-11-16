from fastapi import APIRouter, HTTPException, status

from app.db.session import db_healthcheck


router = APIRouter()


@router.get("/health", tags=["health"])
async def health_check() -> dict:
    """Basic health endpoint used by tests and monitoring."""
    return {"status": "ok"}


@router.get("/health/db", tags=["health"])
async def health_check_db() -> dict:
    """Database connectivity health check.

    Returns 200 when PostgreSQL is reachable, 503 otherwise.
    """

    if not db_healthcheck():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="database unavailable",
        )
    return {"database": "ok"}
