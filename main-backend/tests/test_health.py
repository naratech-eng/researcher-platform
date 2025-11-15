from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint_ok() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "ok"
