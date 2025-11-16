import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app


client = TestClient(app)
settings = get_settings()


@pytest.mark.skipif(
    not settings.has_postgres,
    reason="PostgreSQL not configured for main-backend",
)
def test_db_health_ok() -> None:
    response = client.get("/api/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data.get("database") == "ok"
