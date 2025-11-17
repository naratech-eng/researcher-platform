"""Integration tests for enhanced /chat features."""

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app


client = TestClient(app)
settings = get_settings()


def test_chat_response_structure():
    """Test that /chat response has the correct structure with all artifacts."""
    payload = {
        "messages": [
            {"role": "user", "content": "Hello, test query"}
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Verify response structure
    assert "answer" in data
    assert "artifacts" in data
    assert "citations" in data

    # Verify artifacts structure
    artifacts = data["artifacts"]
    assert "tables" in artifacts
    assert "charts" in artifacts
    assert "files" in artifacts
    assert "code_snippets" in artifacts

    # All should be lists
    assert isinstance(artifacts["tables"], list)
    assert isinstance(artifacts["charts"], list)
    assert isinstance(artifacts["files"], list)
    assert isinstance(artifacts["code_snippets"], list)


@pytest.mark.skipif(
    not settings.has_postgres,
    reason="PostgreSQL not configured",
)
def test_chat_with_genetics_query():
    """Test /chat with a genetics database query."""
    payload = {
        "messages": [
            {"role": "user", "content": "Show me animals from the genetics database"}
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Should have table artifacts
    assert len(data["artifacts"]["tables"]) >= 1


@pytest.mark.skipif(
    not settings.has_postgres or not settings.has_charts,
    reason="PostgreSQL or charts not configured",
)
def test_chat_with_chart_request():
    """Test /chat with a chart generation request."""
    payload = {
        "messages": [
            {"role": "user", "content": "Show me a chart of animals by sex"}
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Should have both table and chart artifacts
    assert len(data["artifacts"]["tables"]) >= 1
    
    # Chart might be generated if data is available
    charts = data["artifacts"]["charts"]
    assert isinstance(charts, list)


@pytest.mark.skipif(
    not settings.has_rag,
    reason="RAG not configured",
)
def test_chat_with_literature_request():
    """Test /chat with a request for scientific literature."""
    payload = {
        "messages": [
            {"role": "user", "content": "What research exists on GWAS in livestock?"}
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Should have citations (if papers were found)
    citations = data.get("citations")
    if citations:
        assert isinstance(citations, list)
        if len(citations) > 0:
            citation = citations[0]
            assert "id" in citation
            assert "title" in citation
            assert "authors" in citation
            assert "url" in citation


@pytest.mark.skipif(
    not settings.has_statistical_analysis or not settings.has_postgres,
    reason="Statistical analysis or PostgreSQL not configured",
)
def test_chat_with_statistical_analysis_request():
    """Test /chat with a statistical analysis request."""
    payload = {
        "messages": [
            {"role": "user", "content": "Perform a linear regression analysis on animal data"}
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Response should be valid
    assert len(data["answer"]) > 0


@pytest.mark.skipif(
    not settings.has_code_snippets,
    reason="Code snippets not configured",
)
def test_code_snippets_structure():
    """Test that code snippets have the correct structure when generated."""
    # This is a structure test - actual generation depends on query type
    # Just verify the endpoint accepts the artifact type
    
    payload = {
        "messages": [
            {"role": "user", "content": "test"}
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Verify code_snippets field exists
    assert "code_snippets" in data["artifacts"]
    assert isinstance(data["artifacts"]["code_snippets"], list)


def test_chat_with_mathematical_expression():
    """Test that mathematical expressions are handled correctly."""
    payload = {
        "messages": [
            {"role": "user", "content": "What is the regression equation y = 2x + 3?"}
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Answer should be non-empty
    assert len(data["answer"]) > 0


def test_chat_multiple_features_integration():
    """Test /chat with multiple features in one request."""
    payload = {
        "messages": [
            {
                "role": "user",
                "content": "Analyze genetics data, create a visualization, and provide scientific references"
            }
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Should have valid response structure
    assert "answer" in data
    assert "artifacts" in data
    assert len(data["answer"]) > 0


@pytest.mark.skipif(
    not settings.has_llm,
    reason="LLM not configured",
)
def test_chat_with_llm_enabled():
    """Test /chat with LLM enabled for answer refinement."""
    payload = {
        "messages": [
            {"role": "user", "content": "Explain heritability in animal breeding"}
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    # LLM should provide a refined answer
    assert len(data["answer"]) > 0
    assert isinstance(data["answer"], str)


def test_chat_with_empty_messages():
    """Test /chat with empty messages list."""
    payload = {
        "messages": []
    }

    response = client.post("/chat", json=payload)
    # Should either return 200 with error message or 422 validation error
    assert response.status_code in [200, 422]


def test_chat_with_system_message():
    """Test /chat with system message."""
    payload = {
        "messages": [
            {"role": "system", "content": "You are a genetics expert"},
            {"role": "user", "content": "What is a SNP?"}
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["answer"]) > 0


def test_chat_conversation_history():
    """Test /chat with conversation history."""
    payload = {
        "messages": [
            {"role": "user", "content": "What is genetics?"},
            {"role": "assistant", "content": "Genetics is the study of genes..."},
            {"role": "user", "content": "Tell me more about GWAS"}
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Should handle conversation context
    assert len(data["answer"]) > 0


@pytest.mark.skipif(
    not settings.has_postgres and not settings.has_rag,
    reason="Neither PostgreSQL nor RAG configured - need at least one",
)
def test_chat_feature_flags_respect():
    """Test that feature flags are respected."""
    payload = {
        "messages": [
            {"role": "user", "content": "Query genetics database"}
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Should return valid response regardless of feature flags
    assert "answer" in data
    assert "artifacts" in data


def test_chat_invalid_message_role():
    """Test /chat with invalid message role."""
    payload = {
        "messages": [
            {"role": "invalid_role", "content": "test"}
        ]
    }

    response = client.post("/chat", json=payload)
    # Should return 422 validation error
    assert response.status_code == 422


def test_chat_large_message():
    """Test /chat with a large message."""
    payload = {
        "messages": [
            {"role": "user", "content": "test " * 1000}  # Large message
        ]
    }

    response = client.post("/chat", json=payload)
    # Should handle large messages
    assert response.status_code in [200, 413, 422]  # OK, too large, or validation error


@pytest.mark.skipif(
    not settings.has_postgres,
    reason="PostgreSQL not configured",
)
def test_chat_sql_injection_protection():
    """Test that SQL injection attempts are handled safely."""
    payload = {
        "messages": [
            {"role": "user", "content": "Show animals WHERE 1=1; DROP TABLE animals; --"}
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    
    # Should not crash and should return a response
    data = response.json()
    assert "answer" in data
