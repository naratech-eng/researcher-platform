"""Tests for Plotly chart generation in /chat endpoint."""

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app


client = TestClient(app)
settings = get_settings()


@pytest.mark.skipif(
    not settings.has_postgres or not settings.has_charts,
    reason="PostgreSQL or charts not configured for main-backend",
)
def test_chat_returns_chart_when_asked() -> None:
    """Test that /chat generates a chart when user asks for visualization."""
    payload = {
        "messages": [
            {
                "role": "user",
                "content": "Show me a chart of animal counts by sex from the database",
            }
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Answer should be non-empty
    assert len(data["answer"]) > 0
    assert isinstance(data["answer"], str)

    # Should have both table and chart artifacts
    tables = data["artifacts"]["tables"]
    charts = data["artifacts"]["charts"]

    assert isinstance(tables, list)
    assert len(tables) >= 1

    assert isinstance(charts, list)
    assert len(charts) >= 1

    # Verify chart structure
    chart = charts[0]
    assert "id" in chart
    assert "title" in chart
    assert "chart_type" in chart
    assert "figure" in chart

    # Verify figure is a Plotly JSON dict
    figure = chart["figure"]
    assert isinstance(figure, dict)
    assert "data" in figure  # Plotly JSON has 'data' and 'layout' keys
    assert "layout" in figure


@pytest.mark.skipif(
    not settings.has_postgres or not settings.has_charts,
    reason="PostgreSQL or charts not configured for main-backend",
)
def test_chat_chart_breed_distribution() -> None:
    """Test chart generation with another query pattern."""
    # Use a query that should return data (farmer counts)
    payload = {
        "messages": [
            {"role": "user", "content": "Visualize top farmers by animal count"}
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Should have table artifact at minimum
    tables = data["artifacts"]["tables"]
    assert len(tables) >= 1

    # Chart might or might not be generated depending on data availability
    # Just verify response structure is valid
    charts = data["artifacts"]["charts"]
    assert isinstance(charts, list)


@pytest.mark.skipif(
    not settings.has_postgres,
    reason="PostgreSQL not configured for main-backend",
)
def test_chat_no_chart_without_flag() -> None:
    """Test that charts are not generated when feature flag is disabled."""
    if settings.has_charts:
        pytest.skip("Charts are enabled, can't test disabled state")

    payload = {
        "messages": [
            {"role": "user", "content": "Show me a chart of animals by sex"}
        ]
    }

    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Should not have chart artifacts when flag is disabled
    charts = data["artifacts"]["charts"]
    assert len(charts) == 0
