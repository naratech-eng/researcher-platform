"""Response formatting service for intelligent table rendering and citation management.

This module provides:
1. Smart table formatting with proper ordering
2. Citation relevance detection
3. Response enhancement based on query type
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional


def should_include_citations(
    query_intent,
    has_citations: bool,
) -> bool:
    """Determine if citations should be included in the response.
    
    Citations should ONLY be shown for explicit research queries.
    Default behavior: NO citations unless user is clearly asking about research.
    
    Args:
        query_intent: QueryIntent object from intelligent_sql_agent
        has_citations: Whether citations are available
        
    Returns:
        True if citations should be included
    """
    if not has_citations:
        return False
    
    # ONLY show citations for research queries
    # All other queries (database, ambiguous, etc.) should NOT show citations
    return query_intent.is_research_query


def format_table_with_ordering(
    table: Dict[str, Any],
    requires_ordering: bool = False,
) -> Dict[str, Any]:
    """Format table data with proper ordering/numbering if needed.
    
    Args:
        table: Table artifact with columns and rows
        requires_ordering: Whether to add row numbers
        
    Returns:
        Enhanced table artifact
    """
    if not table or not table.get("rows"):
        return table
    
    # Check if table already has a numbering column
    columns = table.get("columns", [])
    has_number_column = any(
        col.lower() in ["#", "no", "number", "rank", "row_number"]
        for col in columns
    )
    
    # Add numbering if required and not already present
    if requires_ordering and not has_number_column:
        # Add row number column
        new_columns = ["#"] + columns
        new_rows = []
        
        for idx, row in enumerate(table["rows"], start=1):
            new_rows.append([idx] + list(row))
        
        return {
            **table,
            "columns": new_columns,
            "rows": new_rows,
        }
    
    return table


def enhance_table_presentation(
    tables: List[Dict[str, Any]],
    query_intent,
) -> List[Dict[str, Any]]:
    """Enhance table presentation based on query intent.
    
    Args:
        tables: List of table artifacts
        query_intent: QueryIntent object
        
    Returns:
        Enhanced table artifacts
    """
    enhanced_tables = []
    
    for table in tables:
        # Add ordering if needed
        enhanced_table = format_table_with_ordering(
            table,
            requires_ordering=query_intent.requires_ordering,
        )
        
        # Add metadata for frontend rendering hints
        enhanced_table["render_hints"] = {
            "is_aggregation": query_intent.query_type == "aggregation",
            "show_totals": query_intent.query_type in ["count", "aggregation"],
            "highlight_numbers": query_intent.requires_ordering,
        }
        
        enhanced_tables.append(enhanced_table)
    
    return enhanced_tables


def generate_smart_answer(
    user_question: str,
    query_intent,
    has_tables: bool,
    has_citations: bool,
    fallback_answer: str,
) -> str:
    """Generate a smart answer message based on query type.
    
    Args:
        user_question: User's question
        query_intent: QueryIntent object
        has_tables: Whether table data is available
        has_citations: Whether citations are available
        fallback_answer: Fallback answer text
        
    Returns:
        Enhanced answer text
    """
    # Research queries with citations
    if query_intent.is_research_query and has_citations:
        return fallback_answer  # Keep existing literature-focused answer
    
    # Database queries with tables
    if query_intent.is_database_query and has_tables:
        if query_intent.query_type == "aggregation":
            return "Here are the aggregated results from the genetics database."
        elif query_intent.query_type == "count":
            return "Here is the count from the genetics database."
        elif query_intent.query_type == "list":
            return "Here are the records from the genetics database."
        else:
            return "Here are the results from the genetics database."
    
    # Fallback
    return fallback_answer


def format_citation_list(
    citations: List[Dict[str, Any]],
    query_intent,
    max_citations: int = 20,
) -> List[Dict[str, Any]]:
    """Format and filter citation list based on relevance.
    
    Args:
        citations: Raw citation list
        query_intent: QueryIntent object
        max_citations: Maximum number of citations to return
        
    Returns:
        Filtered and formatted citation list
    """
    if not should_include_citations(query_intent, bool(citations)):
        return []
    
    # For research queries, return appropriate number of citations
    if query_intent.is_research_query:
        return citations[:max_citations]
    
    return []


def create_response_metadata(
    query_intent,
    execution_info: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Create metadata about the response for frontend consumption.
    
    Args:
        query_intent: QueryIntent object
        execution_info: Optional execution information (SQL query, etc.)
        
    Returns:
        Metadata dict
    """
    metadata = {
        "query_type": query_intent.query_type,
        "is_database_query": query_intent.is_database_query,
        "is_research_query": query_intent.is_research_query,
        "has_ordering": query_intent.requires_ordering,
    }
    
    if execution_info:
        if "sql_query" in execution_info:
            metadata["sql_query"] = execution_info["sql_query"]
    
    return metadata
