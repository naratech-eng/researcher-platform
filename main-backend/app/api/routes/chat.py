from typing import List, Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings
from app.services.genetics_chart import generate_chart_from_genetics_query
from app.services.intelligent_sql_agent import (
    analyze_query_intent,
    execute_intelligent_sql_query,
)
from app.services.langchain_summarizer import summarize_with_tables
from app.services.literature_summarizer import summarize_literature_answer
from app.services.llm_client import generate_llm_answer
from app.services.rag_literature import retrieve_literature_for_question
from app.services.response_formatter import (
    enhance_table_presentation,
    format_citation_list,
    generate_smart_answer,
    should_include_citations,
)


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
    code_snippets: List[dict] = []  # Copyable code blocks with language and content
    table_explanation: str = ""  # Detailed explanation to show after tables


class ChatResponse(BaseModel):
    answer: str
    artifacts: ChatArtifacts
    citations: Optional[List[dict]] = None


@router.post("/chat", response_model=ChatResponse, tags=["chat"])
async def chat_endpoint(payload: ChatRequest) -> ChatResponse:
    """Enhanced /chat endpoint with intelligent query understanding.

    Improvements:
    - Uses LangChain SQL agent to intelligently understand queries
    - Dynamically determines when to show tables with proper ordering
    - Only shows citations for research queries, not database queries
    - Properly formats numbered/ordered results
    """

    # Find the last user message if present
    last_user: Optional[ChatMessage] = None
    for msg in reversed(payload.messages):
        if msg.role == "user":
            last_user = msg
            break

    artifacts = ChatArtifacts()
    raw_citations: List[dict] = []
    settings = get_settings()

    if last_user is None:
        return ChatResponse(
            answer="No user message found in the conversation.",
            artifacts=artifacts,
            citations=[],
        )

    # Step 1: Analyze query intent using intelligent agent
    query_intent = analyze_query_intent(last_user.content)
    
    answer = ""
    
    # Step 2: Handle research queries (literature-grounded answers)
    if query_intent.is_research_query and settings.has_rag:
        literature_result = retrieve_literature_for_question(last_user.content)
        if literature_result:
            raw_citations = literature_result.get("citations", [])
            papers = literature_result.get("papers", [])
            num_citations = len(raw_citations)

            if num_citations > 0 and papers:
                # Build a simple fallback summary in case the LLM call fails
                highlight_titles = [c.get("title", "") for c in raw_citations[:3]]
                highlight_titles = [title for title in highlight_titles if title]
                highlight_summary = "; ".join(highlight_titles)
                source_note = "These include papers from arXiv, PubMed, and Nature where available."

                if highlight_summary:
                    fallback_answer = (
                        f"I found {num_citations} recent papers relevant to your question. "
                        f"Highlights include: {highlight_summary}. {source_note}"
                    )
                else:
                    fallback_answer = (
                        f"I gathered {num_citations} recent papers relevant to your question. "
                        f"{source_note}"
                    )

                # Use literature-aware summarizer to generate a grounded answer
                answer = summarize_literature_answer(
                    user_question=last_user.content,
                    papers=papers,
                    fallback_answer=fallback_answer,
                )
            else:
                answer = (
                    "I searched the literature sources but couldn't find relevant papers for this question. "
                    "Please try a different phrasing."
                )
        else:
            answer = (
                "I tried searching the literature sources but encountered an issue. "
                "Please try again in a moment."
            )
    
    # Step 3: Handle database queries
    if query_intent.is_database_query:
        # Use intelligent SQL agent to get structured data
        structured_result = execute_intelligent_sql_query(
            last_user.content,
            intent=query_intent,
        )
        
        if structured_result:
            # Create table artifact
            table = {
                "id": "genetics_query_result",
                "title": "Query Results",
                "columns": structured_result["columns"],
                "rows": structured_result["rows"],
            }
            artifacts.tables.append(table)
            
            # Try to generate chart if query seems visualization-friendly
            question_lower = last_user.content.lower()
            chart_keywords = [
                "chart",
                "graph",
                "plot",
                "visualize",
                "visualise",
                "visualization",
                "visualisation",
                "viz",
                "figure",
                "diagram",
                "distribution",
                "histogram",
                "bar chart",
                "line chart",
                "scatter plot",
            ]
            wants_chart = any(kw in question_lower for kw in chart_keywords)

            if wants_chart and settings.has_charts:
                chart = generate_chart_from_genetics_query(last_user.content, structured_result)
                if chart:
                    artifacts.charts.append(chart)
            
            # Generate smart answer based on query type
            if not answer:  # Don't override research answer
                answer = generate_smart_answer(
                    user_question=last_user.content,
                    query_intent=query_intent,
                    has_tables=True,
                    has_citations=bool(raw_citations),
                    fallback_answer="Here are the results from the genetics database.",
                )
        else:
            # Fallback if intelligent agent fails
            if not answer:
                answer = (
                    "I tried to query the genetics database but encountered an issue. "
                    "Please try rephrasing your question."
                )
    
    # Step 4: Fallback for other queries
    if not answer:
        answer = f"You said: {last_user.content}"
    
    # Step 5: Enhance table presentation with ordering/numbering
    if artifacts.tables:
        artifacts.tables = enhance_table_presentation(
            artifacts.tables,
            query_intent,
        )
    
    # Step 6: Apply LLM summarization if enabled
    if settings.has_langchain_summarizer and artifacts.tables:
        summary_result = summarize_with_tables(
            user_question=last_user.content,
            tables=artifacts.tables,
            fallback_answer=answer,
        )
        # Extract intro for the answer and explanation for after the table
        answer = summary_result.get("intro", answer)
        artifacts.table_explanation = summary_result.get("explanation", "")
    elif settings.has_llm and not query_intent.is_research_query:
        # Only use basic LLM refinement for non-research queries
        answer = generate_llm_answer(payload.messages, answer)
    
    # Step 7: Filter citations based on query intent
    # Only include citations for research queries, NOT for database queries
    final_citations = format_citation_list(
        raw_citations,
        query_intent,
        max_citations=20,
    )

    return ChatResponse(
        answer=answer,
        artifacts=artifacts,
        citations=final_citations,
    )
