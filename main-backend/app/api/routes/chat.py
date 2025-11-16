from typing import List, Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel


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
    """Initial /chat stub.

    For now this simply echoes the last user message as the answer and
    returns empty artifacts and citations. This will later be replaced by
    the full LangChain-based orchestrator.
    """

    # Find the last user message if present
    last_user = None
    for msg in reversed(payload.messages):
        if msg.role == "user":
            last_user = msg
            break

    if last_user is not None:
        answer = f"You said: {last_user.content}"
    else:
        answer = "No user message found in the conversation."

    return ChatResponse(
        answer=answer,
        artifacts=ChatArtifacts(),
        citations=[],
    )
