import os
from functools import lru_cache
from typing import Optional


class Settings:
    """Runtime configuration for the main-backend service.

    For now this is intentionally minimal. The primary setting we care
    about is the PostgreSQL connection string for the internal genetic DB.
    """

    def __init__(self) -> None:
        # e.g. "postgresql+psycopg://user:password@host:5432/dbname"
        self.postgres_dsn: Optional[str] = os.getenv("MAIN_BACKEND_POSTGRES_DSN")
        self.environment: str = os.getenv("MAIN_BACKEND_ENV", "dev")

    @property
    def has_postgres(self) -> bool:
        return bool(self.postgres_dsn)


@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings instance."""

    return Settings()
