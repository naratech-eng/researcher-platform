import os
from functools import lru_cache
from typing import Optional


class Settings:
    """Runtime configuration for the main-backend service.

    For now this is intentionally minimal. The primary setting we care
    about is the PostgreSQL connection string for the internal genetic DB.
    """

    def __init__(self) -> None:
        # Preferred: full DSN via env, e.g.:
        #   postgresql+psycopg2://user:password@host:5432/dbname
        dsn = os.getenv("MAIN_BACKEND_POSTGRES_DSN")

        # Fallback: construct DSN from individual env vars so that
        # username and password can be injected from Secrets Manager.
        if not dsn:
            host = os.getenv("MAIN_BACKEND_DB_HOST")
            port = os.getenv("MAIN_BACKEND_DB_PORT", "5432")
            name = os.getenv("MAIN_BACKEND_DB_NAME")
            user = os.getenv("MAIN_BACKEND_DB_USER")
            password = os.getenv("MAIN_BACKEND_DB_PASSWORD")

            if all([host, name, user, password]):
                dsn = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{name}"

        self.postgres_dsn: Optional[str] = dsn
        self.environment: str = os.getenv("MAIN_BACKEND_ENV", "dev")

    @property
    def has_postgres(self) -> bool:
        return bool(self.postgres_dsn)


@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings instance."""

    return Settings()
