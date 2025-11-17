import os

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
def test_chat_returns_animals_table_when_asked() -> None:
    payload = {
        "messages": [
            {"role": "user", "content": "List some animals from the genetics database"}
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Answer should mention that a sample table is being returned
    assert "sample of animals" in data["answer"].lower()

    # There should be at least one table artifact
    tables = data["artifacts"]["tables"]
    assert isinstance(tables, list)
    assert len(tables) >= 1

    table = tables[0]
    assert table["id"] == "animals_sample"
    assert table["columns"] == ["animal_id", "sex", "birth_date", "breed_code"]
    # rows may be empty in some environments, but type should be list
    assert isinstance(table["rows"], list)
