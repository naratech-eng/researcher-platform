from __future__ import annotations

from typing import Any, Dict, List

from sqlalchemy import text

from app.db.session import get_engine


def fetch_sample_animals(limit: int = 20) -> Dict[str, Any]:
    """Fetch a small sample of animals from the PostgreSQL genetics database.

    This is a first, read-only genetics query tool used by the /chat endpoint.
    It intentionally returns a small, generic slice of the Animals table.

    Returns a table-like dict structure suitable for use in chat artifacts.
    """

    engine = get_engine()
    if engine is None:
        # No database configured; return an empty table description.
        return {
            "id": "animals_sample",
            "title": "Sample animals (database not configured)",
            "columns": ["animal_id", "sex", "birth_date", "breed_code"],
            "rows": [],
        }

    query = text(
        """
        SELECT animal_id, sex, birth_date, breed_code
        FROM animals
        ORDER BY animal_id
        LIMIT :limit
        """
    )

    with engine.connect() as conn:
        result = conn.execute(query, {"limit": limit})
        rows: List[List[Any]] = [list(row) for row in result]

    return {
        "id": "animals_sample",
        "title": "Sample animals",
        "columns": ["animal_id", "sex", "birth_date", "breed_code"],
        "rows": rows,
    }
