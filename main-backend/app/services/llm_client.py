from __future__ import annotations

from typing import Any, List

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
