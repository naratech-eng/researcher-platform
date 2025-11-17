from typing import List, Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings
from app.services.genetics_query import fetch_sample_animals
from app.services.genetics_sql_agent import query_genetics_db_natural_language
from app.services.langchain_summarizer import summarize_with_tables
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
        # Detect if the user is asking about the genetics database
        content_lower = last_user.content.lower()
        is_genetics_query = any(
            keyword in content_lower
            for keyword in ["database", "genetics", "animal", "trait", "breed", "query", "sql"]
        )

        if is_genetics_query:
            # Use LangChain SQL Agent for natural language to SQL conversion
            table = query_genetics_db_natural_language(last_user.content)
            if table:
                artifacts.tables.append(table)
                answer = "Here are the results from the genetics database."
            else:
                # Fallback if agent fails
                answer = (
                    "I tried to query the genetics database but encountered an issue. "
                    "Please try rephrasing your question."
                )
        else:
            answer = f"You said: {last_user.content}"

    # Optionally let the LLM refine the answer when configured.
    settings = get_settings()
    
    # If LangChain summarizer is enabled and we have table artifacts,
    # use it for data-aware responses
    if settings.has_langchain_summarizer and artifacts.tables:
        answer = summarize_with_tables(
            user_question=last_user.content if last_user else "",
            tables=artifacts.tables,
            fallback_answer=answer,
        )
    # Otherwise fall back to basic LLM refinement if enabled
    elif settings.has_llm:
        answer = generate_llm_answer(payload.messages, answer)

    return ChatResponse(
        answer=answer,
        artifacts=artifacts,
        citations=[],
    )
