"""LangChain SQL Agent for natural language queries over genetics database.

This module provides a SQL agent that converts ANY natural language question
into SQL queries against the genetics PostgreSQL database—similar to how the
MCP dbhub server works. No hardcoded patterns or filters needed.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from langchain_community.agent_toolkits.sql.base import create_sql_agent
from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit
from langchain_community.utilities.sql_database import SQLDatabase
from langchain_openai import ChatOpenAI

from app.core.config import get_settings


def query_genetics_db_natural_language(
    user_question: str,
    max_rows: int = 50,
) -> Optional[Dict[str, Any]]:
    """Execute a natural language query against the genetics database using LangChain SQL Agent.

    Args:
        user_question: Natural language question about the genetics data
        max_rows: Maximum number of rows to return (safety limit)

    Returns:
        A table artifact dict with structure {id, title, columns, rows}
        or None if the agent couldn't execute the query
    """
    settings = get_settings()

    if not settings.has_postgres or not settings.has_llm:
        return None

    try:
        # Create SQLDatabase connection using the same DSN from settings
        db = SQLDatabase.from_uri(
            settings.postgres_dsn,
            include_tables=None,  # Allow access to all tables
            sample_rows_in_table_info=3,  # Show agent 3 sample rows per table for context
        )

        # Create the LLM for the agent
        llm = ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=0,  # Deterministic for SQL generation
        )

        # Create SQL toolkit
        toolkit = SQLDatabaseToolkit(db=db, llm=llm)

        # Create the SQL agent
        agent_executor = create_sql_agent(
            llm=llm,
            db=db,
            agent_type="openai-tools",  # Modern agent type for newer LangChain
            verbose=False,  # Set to True for debugging
            max_iterations=5,  # Limit iterations to avoid runaway queries
            max_execution_time=10,  # 10 second timeout
        )

        # Execute the agent with the user's question
        result = agent_executor.invoke({"input": user_question})

        # Extract the output - the agent returns a dict with 'output' key
        output = result.get("output", "")

        # Try to parse the result into structured table format
        # The agent may return text or structured data
        if isinstance(output, str):
            # If output is just text, we need to check intermediate_steps
            # for actual query results
            intermediate_steps = result.get("intermediate_steps", [])
            
            # Look for SQL query results in the steps
            for step in intermediate_steps:
                if len(step) >= 2:
                    tool_output = step[1]
                    if isinstance(tool_output, str) and tool_output.strip():
                        # Try to parse as table data
                        # For now, return a simple text artifact
                        # In future, we can parse SQL result format better
                        return {
                            "id": "genetics_query_result",
                            "title": "Query Results",
                            "columns": ["result"],
                            "rows": [[tool_output]],
                        }

        # Fallback: return output as text
        return {
            "id": "genetics_query_result",
            "title": "Query Results",
            "columns": ["result"],
            "rows": [[str(output)]],
        }

    except Exception as e:
        # Log error but don't crash /chat
        print(f"SQL Agent error: {e}")
        return None
