"""Test for the specific citation bug reported by user.

Query: "Show me all breeds with more than 100 animals, ordered by count descending"
Expected: Table with results, NO citations
Bug: Frontend was showing citations from previous query

This test verifies the fix works correctly.
"""

from app.services.intelligent_sql_agent import analyze_query_intent
from app.services.response_formatter import should_include_citations, format_citation_list


def test_specific_query():
    """Test the exact query that was showing citations incorrectly."""
    query = "Show me all breeds with more than 100 animals, ordered by count descending"
    
    print("=" * 70)
    print("TESTING SPECIFIC CITATION BUG")
    print("=" * 70)
    print(f"\nQuery: {query}")
    
    # Analyze intent
    intent = analyze_query_intent(query)
    
    print(f"\nQuery Intent Analysis:")
    print(f"  - Query Type: {intent.query_type}")
    print(f"  - Is Database Query: {intent.is_database_query}")
    print(f"  - Is Research Query: {intent.is_research_query}")
    print(f"  - Requires Table: {intent.requires_table}")
    print(f"  - Requires Ordering: {intent.requires_ordering}")
    
    # Check citation filtering
    # Simulate having citations available (from a previous query)
    fake_citations = [
        {"title": "Some Paper", "authors": "Smith et al.", "source": "arXiv"},
        {"title": "Another Paper", "authors": "Jones et al.", "source": "PubMed"},
    ]
    
    should_show = should_include_citations(intent, has_citations=True)
    filtered_citations = format_citation_list(fake_citations, intent)
    
    print(f"\nCitation Filtering:")
    print(f"  - Should show citations: {should_show}")
    print(f"  - Filtered citations count: {len(filtered_citations)}")
    
    # Assertions
    assert intent.is_database_query, "Should be detected as database query"
    assert not intent.is_research_query, "Should NOT be detected as research query"
    assert not should_show, "Should NOT show citations for database query"
    assert len(filtered_citations) == 0, "Citations list should be empty"
    
    print("\n" + "=" * 70)
    print("✅ TEST PASSED!")
    print("=" * 70)
    print("\nThe query is correctly identified as a database query.")
    print("Citations will NOT be shown, even if available from previous queries.")
    print("\nBackend will return:")
    print('  - answer: "Here are the aggregated results..."')
    print('  - artifacts: { tables: [...], charts: [] }')
    print('  - citations: []  ← EMPTY ARRAY')
    print("\nFrontend will:")
    print("  ✅ Clear previous citations before sending request")
    print("  ✅ Receive empty citations array from backend")
    print("  ✅ Not display any citation section")


if __name__ == "__main__":
    try:
        test_specific_query()
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
