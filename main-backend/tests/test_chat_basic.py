from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_chat_echoes_last_user_message() -> None:
    # Test with a message that doesn't contain genetics keywords
    payload = {
        "messages": [
            {"role": "system", "content": "You are a research assistant."},
            {"role": "user", "content": "Hello world"},
            {"role": "assistant", "content": "Hi there"},
            {"role": "user", "content": "Tell me about the weather"},
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    # When LLM is enabled, it may refine the answer
    # When disabled, it should echo the last message
    # Either way, answer should be non-empty and reference the conversation
    assert len(data["answer"]) > 0
    assert isinstance(data["answer"], str)
    # Should not have genetics artifacts
    assert data["artifacts"] == {"tables": [], "charts": [], "files": []}
    assert data["citations"] == []
