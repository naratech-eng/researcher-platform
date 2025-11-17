from typing import List, Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings
from app.services.genetics_query import fetch_sample_animals
from app.services.llm_client import generate_llm_answer


router = APIRouter()


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


class ChatArtifacts(BaseModel):
    tables: List[dict] = []
    charts: List[dict] = []
    files: List[dict] = []


class ChatResponse(BaseModel):
    answer: str
    artifacts: ChatArtifacts
    citations: Optional[List[dict]] = None


@router.post("/chat", response_model=ChatResponse, tags=["chat"])
async def chat_endpoint(payload: ChatRequest) -> ChatResponse:
    """Initial /chat implementation with a simple genetics tool.

    Behavior:
    - Always finds the last user message.
    - If the message looks like a request about animals, it calls the
      `fetch_sample_animals` tool to return a small sample table from the
      genetics PostgreSQL database.
    - Otherwise, it falls back to echoing the last user message.
    """

    # Find the last user message if present
    last_user: Optional[ChatMessage] = None
    for msg in reversed(payload.messages):
        if msg.role == "user":
            last_user = msg
            break

    artifacts = ChatArtifacts()

    if last_user is None:
        answer = "No user message found in the conversation."
    else:
        # Very simple intent detection for now: if the user mentions
        # "animals" and "show"/"list", run the genetics sample query.
        content_lower = last_user.content.lower()
        if "animals" in content_lower and ("show" in content_lower or "list" in content_lower):
            table = fetch_sample_animals(limit=20)
            artifacts.tables.append(table)
            answer = (
                "Here is a small sample of animals from the genetics database. "
                "Future versions will let you run richer, targeted analyses."
            )
        else:
            answer = f"You said: {last_user.content}"

    # Optionally let the LLM refine the answer when configured.
    settings = get_settings()
    if settings.has_llm:
        answer = generate_llm_answer(payload.messages, answer)

    return ChatResponse(
        answer=answer,
        artifacts=artifacts,
        citations=[],
    )
