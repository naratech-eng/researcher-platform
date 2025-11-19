"""LangChain-based table summarization for data-aware LLM responses.

This module provides a summarizer that takes structured table data (from genetics
queries or other sources) and uses LangChain + OpenAI to generate richer, more
contextual explanations that reference the actual data.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.core.config import get_settings


def summarize_with_tables(
    user_question: str,
    tables: List[Dict[str, Any]],
    fallback_answer: str,
) -> Dict[str, str]:
    """Generate a data-aware answer using LangChain and table artifacts.

    Args:
        user_question: The user's original question
        tables: List of table artifacts with structure {id, title, columns, rows}
        fallback_answer: Text to return if LLM call fails

    Returns:
        Dict with 'intro' (brief text before table) and 'explanation' (detailed text after table)
    """
    settings = get_settings()

    if not settings.has_langchain_summarizer or not tables:
        return {"intro": fallback_answer, "explanation": ""}

    try:
        # Build a compact representation of the tables for the prompt
        table_summaries = []
        for table in tables:
            table_id = table.get("id", "unknown")
            title = table.get("title", "Table")
            columns = table.get("columns", [])
            rows = table.get("rows", [])

            # Include first few rows as examples (limit to avoid token overflow)
            sample_rows = rows[:5] if len(rows) > 5 else rows
            row_count = len(rows)

            table_summary = {
                "id": table_id,
                "title": title,
                "columns": columns,
                "row_count": row_count,
                "sample_rows": sample_rows,
            }
            table_summaries.append(table_summary)

        # Format the table data as JSON for the prompt
        tables_json = json.dumps(table_summaries, indent=2, default=str)

        # Create a LangChain prompt template for detailed explanation
        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are a genetics research assistant. The user has asked a question "
                    "and received data from the genetics database. Provide a detailed explanation "
                    "of what the data shows, referencing specific values, patterns, and insights. "
                    "This explanation will appear AFTER the table, so focus on interpreting the data."
                ),
                (
                    "user",
                    "Question: {question}\n\n"
                    "Data returned from the database:\n{tables}\n\n"
                    "Please provide a detailed explanation of what this data shows, "
                    "including patterns, trends, and key insights from the actual values."
                ),
            ]
        )

        # Initialize the LangChain ChatOpenAI model
        llm = ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=0.7,
        )

        # Create the chain and invoke
        chain = prompt | llm
        result = chain.invoke({"question": user_question, "tables": tables_json})

        # Extract the content from the LangChain response
        explanation = result.content if hasattr(result, "content") else str(result)
        
        # Generate a brief intro
        intro = "Here are the records from the genetics database."
        
        return {"intro": intro, "explanation": explanation or ""}

    except Exception:
        # Fallback gracefully to avoid breaking /chat
        return {"intro": fallback_answer, "explanation": ""}
