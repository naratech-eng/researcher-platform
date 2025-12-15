"""Intelligent SQL Agent using LangChain for dynamic query understanding.

This module provides an enhanced SQL agent that:
1. Understands query intent using LLM
2. Generates appropriate SQL queries dynamically
3. Returns properly structured data for table/chart rendering
4. Handles number ordering and formatting intelligently
"""

from __future__ import annotations

import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from typing import Any, Dict, List, Optional
import json

from langchain_community.agent_toolkits.sql.base import create_sql_agent
from langchain_community.utilities.sql_database import SQLDatabase
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from sqlalchemy import create_engine, text

from app.core.config import get_settings


class QueryIntent:
    """Represents the understood intent of a user query."""
    
    def __init__(
        self,
        query_type: str,  # 'aggregation', 'list', 'count', 'detail'
        requires_table: bool,
        requires_ordering: bool,
        is_database_query: bool,
        is_research_query: bool,
    ):
        self.query_type = query_type
        self.requires_table = requires_table
        self.requires_ordering = requires_ordering
        self.is_database_query = is_database_query
        self.is_research_query = is_research_query


def analyze_query_intent(user_question: str) -> QueryIntent:
    """Use LLM to intelligently analyze query intent.
    
    Args:
        user_question: The user's natural language question
        
    Returns:
        QueryIntent object with understood intent
    """
    settings = get_settings()
    
    if not settings.has_llm:
        # Fallback to simple heuristics
        return _fallback_intent_analysis(user_question)
    
    try:
        llm = ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=0,
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a query intent analyzer for a genetics research platform.
Analyze the user's question and determine:
1. query_type: 'aggregation' (count, sum, avg), 'list' (show records), 'count' (just counting), or 'detail' (specific info)
2. requires_table: true if results should be shown as a table
3. requires_ordering: true if results should be ordered/ranked
4. is_database_query: true if asking about data in the database (animals, traits, farmers, etc.)
5. is_research_query: true if asking about research, papers, literature, studies, scientific findings,
   or statistical / genetic methods (e.g., heritability, genetic correlation, GWAS power, linear mixed models).

Respond ONLY with a JSON object in this exact format:
{{
  "query_type": "aggregation|list|count|detail",
  "requires_table": true|false,
  "requires_ordering": true|false,
  "is_database_query": true|false,
  "is_research_query": true|false
}}"""),
            ("user", "Question: {question}\n\nProvide your analysis as JSON:"),
        ])
        
        chain = prompt | llm
        result = chain.invoke({"question": user_question})
        content = result.content if hasattr(result, "content") else str(result)
        
        # Parse JSON response
        # Extract JSON from markdown code blocks if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        analysis = json.loads(content)
        
        return QueryIntent(
            query_type=analysis.get("query_type", "list"),
            requires_table=analysis.get("requires_table", False),
            requires_ordering=analysis.get("requires_ordering", False),
            is_database_query=analysis.get("is_database_query", False),
            is_research_query=analysis.get("is_research_query", False),
        )
        
    except Exception as e:
        print(f"Intent analysis error: {e}")
        return _fallback_intent_analysis(user_question)


def _fallback_intent_analysis(user_question: str) -> QueryIntent:
    """Fallback intent analysis using simple heuristics."""
    question_lower = user_question.lower()
    
    # Check for database query keywords
    is_database_query = any(
        kw in question_lower
        for kw in ["database", "animal", "trait", "breed", "farmer", "query", "sql", "show", "list", "count"]
    )
    
    # Check for research / literature / statistical-method query keywords
    is_research_query = any(
        kw in question_lower
        for kw in [
            "research",
            "paper",
            "papers",
            "study",
            "studies",
            "literature",
            "citation",
            "citations",
            "publication",
            "journal",
            "findings",
            # Statistical / genetic method terms that should use RAG literature
            "heritability",
            "genetic correlation",
            "gwas",
            "genome-wide association",
            "linear mixed model",
            "mixed model",
            "lmm",
            "logistic regression",
            "association model",
            "statistical power",
            "multiple testing",
            "bonferroni",
            "fdr",
        ]
    )
    
    # Determine query type
    if any(kw in question_lower for kw in ["count", "how many", "number of"]):
        query_type = "count"
    elif any(kw in question_lower for kw in ["average", "sum", "total", "group by"]):
        query_type = "aggregation"
    elif any(kw in question_lower for kw in ["show", "list", "display", "all"]):
        query_type = "list"
    else:
        query_type = "detail"
    
    # Tables needed for aggregations and lists
    requires_table = query_type in ["aggregation", "list"]
    
    # Ordering needed for ranked/sorted results
    requires_ordering = any(
        kw in question_lower
        for kw in ["top", "bottom", "highest", "lowest", "most", "least", "ranked", "sorted"]
    )
    
    return QueryIntent(
        query_type=query_type,
        requires_table=requires_table,
        requires_ordering=requires_ordering,
        is_database_query=is_database_query,
        is_research_query=is_research_query,
    )


def execute_intelligent_sql_query(
    user_question: str,
    intent: Optional[QueryIntent] = None,
) -> Optional[Dict[str, Any]]:
    """Execute SQL query with intelligent structure based on intent.
    
    Args:
        user_question: Natural language question
        intent: Pre-analyzed intent (will analyze if not provided)
        
    Returns:
        Structured result with columns, rows, and metadata
    """
    settings = get_settings()
    
    if not settings.has_postgres or not settings.has_llm:
        return None
    
    # Analyze intent if not provided
    if intent is None:
        intent = analyze_query_intent(user_question)
    
    # Only proceed if this is a database query
    if not intent.is_database_query:
        return None
    
    try:
        # Create SQLDatabase connection
        db = SQLDatabase.from_uri(
            settings.postgres_dsn,
            include_tables=None,
            sample_rows_in_table_info=1,
        )
        
        # Create LLM for the agent
        llm = ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=0,
            timeout=15,
        )
        
        # Enhanced system prefix with ordering instructions
        system_prefix = """You are an expert SQL query generator for a genetics research database.

When generating queries:
1. Always use proper ORDER BY clauses when results should be ranked or sorted
2. Add ROW_NUMBER() or generate explicit numbering when appropriate
3. Use LIMIT to restrict large result sets
4. Format numeric columns appropriately
5. Handle NULL values gracefully with COALESCE

Available tables: animals, traits, and other genetics-related tables.
"""
        
        # Create SQL agent with enhanced instructions
        agent_executor = create_sql_agent(
            llm=llm,
            db=db,
            agent_type="openai-tools",
            verbose=False,
            # Keep within API Gateway’s ~29s timeout budget
            max_iterations=6,
            max_execution_time=18,
            prefix=system_prefix,
        )
        
        # Configure agent executor to return intermediate steps
        agent_executor.return_intermediate_steps = True
        
        # Execute the query with a hard timeout to stay under API Gateway limits
        with ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(agent_executor.invoke, {"input": user_question})
            try:
                result = future.result(timeout=18)
            except FuturesTimeoutError:
                future.cancel()
                raise TimeoutError("SQL agent timed out")
        
        # Parse the result to extract structured data
        structured_data = _extract_structured_data_from_agent_result(result, db)
        
        if structured_data:
            # Add metadata about the query
            structured_data["metadata"] = {
                "query_type": intent.query_type,
                "has_ordering": intent.requires_ordering,
                "is_aggregation": intent.query_type == "aggregation",
            }
            return structured_data
        
        return None
        
    except Exception as e:
        # Friendly fallback so API Gateway returns 200 with a helpful message instead of timing out
        print(f"Intelligent SQL query error: {e}")
        return {
            "error_message": (
                "The database query took too long or failed. "
                "Please try a simpler question or rephrase."
            )
        }


def _extract_structured_data_from_agent_result(
    result: Dict[str, Any],
    db: SQLDatabase,
) -> Optional[Dict[str, Any]]:
    """Extract structured data from SQL agent result.
    
    Args:
        result: Agent execution result
        db: SQLDatabase instance for re-executing queries
        
    Returns:
        Structured data dict or None
    """
    try:
        # Check intermediate steps for SQL queries
        intermediate_steps = result.get("intermediate_steps", [])
        
        # Find the last successful SQL query execution
        last_sql_query = None
        last_result = None
        
        for step in intermediate_steps:
            if len(step) >= 2:
                action = step[0]
                observation = step[1]
                
                tool_name = str(action.tool) if hasattr(action, "tool") else "unknown"
                
                # Look specifically for sql_db_query tool (the actual query executor)
                if tool_name == "sql_db_query":
                    # Extract the SQL query
                    if hasattr(action, "tool_input"):
                        query_input = action.tool_input
                        if isinstance(query_input, dict):
                            last_sql_query = query_input.get("query", "")
                        else:
                            last_sql_query = str(query_input)
                        last_result = observation
        
        # If we found a SQL query, re-execute it to get structured data
        if last_sql_query:
            # Clean the query
            query = last_sql_query.strip()
            if query.endswith(";"):
                query = query[:-1]
            
            # Execute directly with SQLAlchemy for structured results
            settings = get_settings()
            engine = create_engine(settings.postgres_dsn)
            
            with engine.connect() as conn:
                result_proxy = conn.execute(text(query))
                rows = result_proxy.fetchall()
                columns = list(result_proxy.keys())
                
                # Convert rows to list of lists
                data_rows = [list(row) for row in rows]
                
                return {
                    "columns": columns,
                    "rows": data_rows,
                    "sql_query": query,
                }
        
        # Fallback: try to parse the output text
        output = result.get("output", "")
        if output and isinstance(output, str):
            # If the agent stopped because it hit its iteration limit, treat
            # this as an error rather than pretending it is real query data.
            if "agent stopped due to max iterations" in output.lower():
                return None

            return {
                "columns": ["result"],
                "rows": [[output]],
                "sql_query": None,
            }
        
        return None
        
    except Exception as e:
        print(f"Error extracting structured data: {e}")
        return None
