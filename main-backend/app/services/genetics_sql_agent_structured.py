"""Enhanced SQL Agent that returns structured data suitable for charting.

This module extends the basic SQL agent to return properly structured table data
with separate columns and rows, making it suitable for both table display and
chart generation.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from sqlalchemy import create_engine, text

from app.core.config import get_settings


def execute_sql_query_for_chart(
    user_question: str,
) -> Optional[Dict[str, Any]]:
    """Execute a SQL query and return structured results suitable for charting.

    This function uses a simpler approach: let the LLM generate SQL via the agent,
    but execute it directly for structured results.

    Args:
        user_question: Natural language question

    Returns:
        A structured result dict with {columns: [...], rows: [[...]]}
        or None if query fails
    """
    settings = get_settings()

    if not settings.has_postgres:
        return None

    try:
        # First, try to detect if this is an aggregation query
        # Common patterns: "count by", "group by", "how many"
        query_lower = user_question.lower()
        
        # Build a simple SQL query based on common patterns
        sql_query = None
        
        # Flexible pattern matching for sex-based counts/charts
        if ("sex" in query_lower and 
            any(kw in query_lower for kw in ["count", "chart", "plot", "graph", "visualize", "show"])):
            sql_query = """
                SELECT 
                    COALESCE(sex, 'Unknown') as sex,
                    COUNT(*) as count
                FROM animals
                GROUP BY sex
                ORDER BY count DESC
            """
        
        # Flexible pattern matching for breed-based counts/charts
        elif ("breed" in query_lower and 
              any(kw in query_lower for kw in ["count", "chart", "plot", "graph", "visualize", "show"])):
            sql_query = """
                SELECT breed_code, COUNT(*) as count
                FROM animals
                WHERE breed_code IS NOT NULL
                GROUP BY breed_code
                ORDER BY count DESC
                LIMIT 10
            """
        
        # Flexible pattern matching for farmer-based counts/charts
        elif ("farmer" in query_lower and 
              any(kw in query_lower for kw in ["count", "chart", "plot", "graph", "visualize", "show"])):
            sql_query = """
                SELECT farmer_id, COUNT(*) as animal_count
                FROM animals
                GROUP BY farmer_id
                ORDER BY animal_count DESC
                LIMIT 10
            """
        
        # If no pattern matched, return None (will fall back to text-based agent)
        if sql_query is None:
            return None

        # Execute the query
        engine = create_engine(settings.postgres_dsn)
        with engine.connect() as conn:
            result = conn.execute(text(sql_query))
            rows = result.fetchall()
            columns = list(result.keys())

            # Convert to list of lists
            data_rows = [list(row) for row in rows]

            return {
                "columns": columns,
                "rows": data_rows,
            }

    except Exception as e:
        print(f"Structured SQL query error: {e}")
        return None
