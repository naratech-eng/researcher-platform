from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from openai import OpenAI

from app.core.config import get_settings


def _get_client() -> OpenAI:
    """Return a configured OpenAI client.

    Relies on the API key provided via Settings (and ultimately environment
    variables or AWS Secrets Manager in deployed environments).
    """

    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    # api_key can also be picked up from OPENAI_API_KEY env var, but we
    # pass it explicitly to make the dependency clear.
    return OpenAI(api_key=settings.openai_api_key)


def generate_llm_answer(messages: List[Any], fallback_answer: str) -> str:
    """Generate an LLM answer for the given chat messages.

    This is intentionally minimal for now:
    - Uses the configured chat model.
    - Sends the full message list to the model.
    - Falls back to the provided fallback_answer if anything goes wrong.
    """

    try:
        settings = get_settings()
        if not settings.openai_api_key or not settings.use_llm_in_chat:
            return fallback_answer

        client = _get_client()
        # Map our message objects to a simple internal representation. We
        # assume each item has `role` and `content` attributes (as in
        # ChatMessage), but avoid importing the concrete type here to
        # prevent circular imports.
        openai_messages = [
            {"role": getattr(msg, "role", None), "content": getattr(msg, "content", "")}
            for msg in messages
        ]
        # Ensure there is at least one system message setting basic behavior.
        if not any(m["role"] == "system" for m in openai_messages):
            openai_messages.insert(
                0,
                {
                    "role": "system",
                    "content": "You are a genetics research assistant. Be concise, and when tables or charts are present, briefly describe what they show.",
                },
            )

        # For now we keep things simple and flatten the conversation into a
        # single text prompt for the Responses API. This is sufficient for a
        # text-only backend orchestrator.
        conversation_lines = []
        for m in openai_messages:
            role = m.get("role") or "user"
            content = m.get("content") or ""
            conversation_lines.append(f"{role}: {content}")

        input_text = (
            "You are a genetics research assistant. Using the conversation "
            "below, produce a concise answer suitable for the user.\n\n"
            + "\n".join(conversation_lines)
        )

        response = client.responses.create(
            model=settings.openai_model,
            input=input_text,
        )

        # The Responses API exposes a convenience property for the combined
        # text output.
        content = getattr(response, "output_text", None)
        return content or fallback_answer
    except Exception:
        # In any failure mode, we return the fallback answer so that /chat
        # still behaves predictably.
        return fallback_answer


def generate_sample_chart_dataset(user_question: str) -> Optional[Dict[str, Any]]:
    """Ask the LLM to craft a small dataset for Plotly chart generation.

    Returns a dict with keys: title, chart_type, columns, rows.
    """

    try:
        settings = get_settings()
        if not settings.has_llm:
            return None

        client = _get_client()
        prompt = (
            "You are a data assistant that creates small synthetic datasets for visualization. "
            "Given the user's request, respond ONLY with valid JSON containing keys \"title\", \"chart_type\", "
            "\"columns\" (list of column names), and \"rows\" (list of rows, each a list of values). "
            "Use simple numeric data (3-8 rows). Example: {\"title\":...,\"chart_type\":\"bar\",\"columns\":[...],\"rows\":[[...]]}. "
            f"User request: {user_question}"
        )

        response = client.responses.create(
            model=settings.openai_model,
            input=prompt,
        )

        content = getattr(response, "output_text", None)
        if not content:
            return None

        dataset = json.loads(content)
        required_keys = {"title", "chart_type", "columns", "rows"}
        if not required_keys.issubset(dataset.keys()):
            return None

        columns = dataset.get("columns")
        rows = dataset.get("rows")
        if not isinstance(columns, list) or not isinstance(rows, list):
            return None
        if not columns or not rows:
            return None

        # Ensure each row is a list with matching length
        normalized_rows = []
        for row in rows:
            if isinstance(row, list) and len(row) == len(columns):
                normalized_rows.append(row)
        if not normalized_rows:
            return None

        dataset["rows"] = normalized_rows
        return dataset
    except Exception:
        return None
