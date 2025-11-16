from __future__ import annotations

from typing import Optional

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.core.config import get_settings


_settings = get_settings()


def get_engine() -> Optional[Engine]:
    """Return a lazily initialized SQLAlchemy engine for PostgreSQL.

    If no DSN is configured, returns None so callers can handle
    the "no database" case explicitly.
    """

    dsn = _settings.postgres_dsn
    if not dsn:
        return None

    # Engine is intentionally created on each call for now; we can
    # optimize with module-level caching later if needed.
    return create_engine(dsn, pool_pre_ping=True, future=True)


def db_healthcheck() -> bool:
    """Run a simple SELECT 1 against PostgreSQL.

    Returns True if the query succeeds, False otherwise.
    """

    engine = get_engine()
    if engine is None:
        return False

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
