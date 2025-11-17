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

    # Answer should be non-empty and reference the data
    # (LangChain summarizer may return different text than static fallback)
    assert len(data["answer"]) > 0
    assert isinstance(data["answer"], str)

    # There should be at least one table artifact
    tables = data["artifacts"]["tables"]
    assert isinstance(tables, list)
    assert len(tables) >= 1

    table = tables[0]
    # SQL Agent returns results with this ID
    assert table["id"] == "genetics_query_result"
    # Columns and rows depend on the SQL agent's query
    assert "columns" in table
    assert "rows" in table
    assert isinstance(table["rows"], list)
