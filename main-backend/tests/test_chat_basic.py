from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_chat_echoes_last_user_message() -> None:
    payload = {
        "messages": [
            {"role": "system", "content": "You are Emilia, a research assistant."},
            {"role": "user", "content": "Hello genetics world"},
            {"role": "assistant", "content": "Hi there"},
            {"role": "user", "content": "Show me something cool"},
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["answer"] == "You said: Show me something cool"
    assert data["artifacts"] == {"tables": [], "charts": [], "files": []}
    assert data["citations"] == []
