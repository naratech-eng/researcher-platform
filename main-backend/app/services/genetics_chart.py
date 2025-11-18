"""Plotly chart generation service for genetics data visualization.

This module provides flexible chart generation using Plotly, supporting all major
chart types (bar, line, scatter, pie, histogram, box, heatmap, etc.). Charts are
returned as Plotly JSON that can be rendered in Next.js with react-plotly.js.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import plotly.utils

from app.services.llm_client import generate_sample_chart_dataset


def generate_chart_from_query_result(
    data: List[List[Any]],
    columns: List[str],
    chart_type: str = "bar",
    title: Optional[str] = None,
    x_column: Optional[str] = None,
    y_column: Optional[str] = None,
    **kwargs,
) -> Dict[str, Any]:
    """Generate a Plotly chart from SQL query results.

    Args:
        data: List of rows (list of lists)
        columns: Column names
        chart_type: Type of chart to generate (bar, line, scatter, pie, histogram, box, heatmap, etc.)
        title: Chart title
        x_column: Column to use for x-axis (defaults to first column)
        y_column: Column to use for y-axis (defaults to second column)
        **kwargs: Additional Plotly-specific parameters

    Returns:
        A chart artifact dict with structure {id, title, chart_type, figure}
        where figure is the Plotly JSON (fig.to_dict())
    """
    # Convert to pandas DataFrame for easier manipulation
    df = pd.DataFrame(data, columns=columns)

    # Auto-select x and y columns if not provided
    if x_column is None and len(columns) > 0:
        x_column = columns[0]
    if y_column is None and len(columns) > 1:
        y_column = columns[1]

    # Default title if not provided
    if title is None:
        title = f"{chart_type.title()} Chart"

    # Generate the appropriate chart based on type
    fig = None

    try:
        if chart_type == "bar":
            fig = px.bar(df, x=x_column, y=y_column, title=title, **kwargs)
        
        elif chart_type == "line":
            fig = px.line(df, x=x_column, y=y_column, title=title, **kwargs)
        
        elif chart_type == "scatter":
            fig = px.scatter(df, x=x_column, y=y_column, title=title, **kwargs)
        
        elif chart_type == "pie":
            # Pie charts use 'names' and 'values' instead of x/y
            names_col = kwargs.get("names", x_column)
            values_col = kwargs.get("values", y_column)
            fig = px.pie(df, names=names_col, values=values_col, title=title)
        
        elif chart_type == "histogram":
            fig = px.histogram(df, x=x_column, title=title, **kwargs)
        
        elif chart_type == "box":
            fig = px.box(df, x=x_column, y=y_column, title=title, **kwargs)
        
        elif chart_type == "violin":
            fig = px.violin(df, x=x_column, y=y_column, title=title, **kwargs)
        
        elif chart_type == "heatmap":
            # For heatmap, we need a pivot or matrix structure
            fig = px.imshow(df.values, labels=dict(x="X", y="Y", color="Value"), title=title, **kwargs)
        
        elif chart_type == "area":
            fig = px.area(df, x=x_column, y=y_column, title=title, **kwargs)
        
        elif chart_type == "funnel":
            fig = px.funnel(df, x=x_column, y=y_column, title=title, **kwargs)
        
        elif chart_type == "sunburst":
            # Sunburst requires 'path' parameter
            path_cols = kwargs.get("path", [x_column])
            values_col = kwargs.get("values", y_column)
            fig = px.sunburst(df, path=path_cols, values=values_col, title=title)
        
        elif chart_type == "treemap":
            # Treemap requires 'path' parameter
            path_cols = kwargs.get("path", [x_column])
            values_col = kwargs.get("values", y_column)
            fig = px.treemap(df, path=path_cols, values=values_col, title=title)
        
        else:
            # Default to bar chart if unknown type
            fig = px.bar(df, x=x_column, y=y_column, title=title, **kwargs)

    except Exception as e:
        # If chart generation fails, create a simple error figure
        fig = go.Figure()
        fig.add_annotation(
            text=f"Chart generation error: {str(e)}",
            xref="paper",
            yref="paper",
            x=0.5,
            y=0.5,
            showarrow=False,
        )
        fig.update_layout(title=f"{chart_type.title()} Chart (Error)")

    # Customize layout for better rendering
    fig.update_layout(
        autosize=True,
        margin=dict(l=50, r=50, t=80, b=50),
        hovermode="closest",
    )

    # Convert figure to JSON and handle numpy arrays
    figure_dict = fig.to_dict()
    
    # Plotly sometimes includes numpy arrays which aren't JSON serializable
    # Convert to JSON and back to ensure everything is serializable
    figure_json = json.loads(json.dumps(figure_dict, cls=plotly.utils.PlotlyJSONEncoder))
    
    # Return the chart artifact
    return {
        "id": f"chart_{chart_type}_{hash(title) % 10000}",
        "title": title,
        "chart_type": chart_type,
        "figure": figure_json,  # Plotly JSON for Next.js
    }


def suggest_chart_type(
    columns: List[str],
    data: List[List[Any]],
    user_intent: Optional[str] = None,
) -> str:
    """Suggest an appropriate chart type based on data and user intent.

    Args:
        columns: Column names from the query result
        data: Data rows
        user_intent: User's question or intent (e.g., "show trends", "compare", "distribution")

    Returns:
        Suggested chart type as string
    """
    # Check user intent for keywords
    if user_intent:
        intent_lower = user_intent.lower()
        
        if any(kw in intent_lower for kw in ["trend", "over time", "time series"]):
            return "line"
        
        if any(kw in intent_lower for kw in ["compare", "comparison", "vs", "versus"]):
            return "bar"
        
        if any(kw in intent_lower for kw in ["distribution", "spread", "histogram"]):
            return "histogram"
        
        if any(kw in intent_lower for kw in ["proportion", "percentage", "pie"]):
            return "pie"
        
        if any(kw in intent_lower for kw in ["correlation", "relationship", "scatter"]):
            return "scatter"
        
        if any(kw in intent_lower for kw in ["box plot", "quartile", "outlier"]):
            return "box"
        
        if any(kw in intent_lower for kw in ["heatmap", "matrix", "correlation matrix"]):
            return "heatmap"

    # Analyze data structure
    num_columns = len(columns)
    num_rows = len(data)

    # If we have exactly 2 columns with reasonable row count, bar is safe default
    if num_columns == 2 and num_rows > 0:
        return "bar"
    
    # If we have 1 column, histogram for distribution
    if num_columns == 1:
        return "histogram"
    
    # Default to bar chart
    return "bar"


def generate_chart_from_genetics_query(
    user_question: str,
    query_result: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Generate a chart from genetics query results with intelligent type selection.

    Args:
        user_question: The user's original question
        query_result: The query result dict with 'columns' and 'rows'

    Returns:
        Chart artifact dict or None if chart generation fails
    """
    columns = query_result.get("columns", [])
    rows = query_result.get("rows", [])

    if not columns or not rows:
        return None

    # Suggest appropriate chart type
    chart_type = suggest_chart_type(columns, rows, user_question)

    # Extract title from question or use default
    title = f"Genetics Data: {chart_type.title()} Chart"
    if "count" in user_question.lower():
        title = "Count Analysis"
    elif "breed" in user_question.lower():
        title = "Breed Distribution"
    elif "sex" in user_question.lower():
        title = "Sex Distribution"

    try:
        return generate_chart_from_query_result(
            data=rows,
            columns=columns,
            chart_type=chart_type,
            title=title,
        )
    except Exception:
        return None


def generate_sample_chart_artifact(
    user_question: str,
) -> Optional[Tuple[Dict[str, Any], Dict[str, Any]]]:
    """Return a sample table + chart artifact when real data is unavailable."""

    dataset = generate_sample_chart_dataset(user_question)
    if not dataset:
        return None

    chart = generate_chart_from_query_result(
        data=dataset["rows"],
        columns=dataset["columns"],
        chart_type=dataset["chart_type"],
        title=dataset["title"],
    )

    table = {
        "id": "sample_chart_data",
        "title": dataset["title"],
        "columns": dataset["columns"],
        "rows": dataset["rows"],
    }

    return table, chart
