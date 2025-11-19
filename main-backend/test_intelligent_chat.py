"""Test script for intelligent chat improvements.

Run this to verify the new intelligent query understanding and citation filtering.

Usage:
    python test_intelligent_chat.py
"""

from app.services.intelligent_sql_agent import analyze_query_intent
from app.services.response_formatter import should_include_citations


def test_query_intent_analysis():
    """Test intelligent query intent analysis."""
    print("=" * 60)
    print("TESTING QUERY INTENT ANALYSIS")
    print("=" * 60)
    
    test_queries = [
        # Database queries (should NOT show citations)
        "How many animals are in the database?",
        "Show me the top 10 breeds by count",
        "List all farmers with more than 5 animals",
        "What is the distribution of animals by sex?",
        
        # Research queries (should show citations)
        "What papers discuss GWAS in cattle?",
        "Show me recent research on heritability",
        "Are there studies on genetic correlation?",
        "What are the latest findings on animal breeding?",
        
        # Mixed/ambiguous
        "Show me animal traits and related research",
    ]
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        intent = analyze_query_intent(query)
        
        print(f"  - Query Type: {intent.query_type}")
        print(f"  - Requires Table: {intent.requires_table}")
        print(f"  - Requires Ordering: {intent.requires_ordering}")
        print(f"  - Is Database Query: {intent.is_database_query}")
        print(f"  - Is Research Query: {intent.is_research_query}")
        
        # Check citation logic
        should_show_citations = should_include_citations(intent, has_citations=True)
        print(f"  → Should show citations: {should_show_citations}")
        
        # Validate logic
        if intent.is_database_query and not intent.is_research_query:
            assert not should_show_citations, "Database queries should NOT show citations"
        if intent.is_research_query:
            assert should_show_citations, "Research queries SHOULD show citations"


def test_citation_filtering():
    """Test smart citation filtering logic."""
    print("\n" + "=" * 60)
    print("TESTING CITATION FILTERING")
    print("=" * 60)
    
    from app.services.intelligent_sql_agent import QueryIntent
    
    # Test case 1: Pure database query
    db_intent = QueryIntent(
        query_type="count",
        requires_table=True,
        requires_ordering=False,
        is_database_query=True,
        is_research_query=False,
    )
    
    result1 = should_include_citations(db_intent, has_citations=True)
    print(f"\nDatabase query + citations available → Show citations: {result1}")
    assert not result1, "Should NOT show citations for pure database queries"
    
    # Test case 2: Pure research query
    research_intent = QueryIntent(
        query_type="detail",
        requires_table=False,
        requires_ordering=False,
        is_database_query=False,
        is_research_query=True,
    )
    
    result2 = should_include_citations(research_intent, has_citations=True)
    print(f"Research query + citations available → Show citations: {result2}")
    assert result2, "Should show citations for research queries"
    
    # Test case 3: No citations available
    result3 = should_include_citations(research_intent, has_citations=False)
    print(f"Research query + no citations → Show citations: {result3}")
    assert not result3, "Should NOT show citations when none available"
    
    print("\n✅ All citation filtering tests passed!")


def test_table_ordering():
    """Test automatic table numbering."""
    print("\n" + "=" * 60)
    print("TESTING TABLE ORDERING")
    print("=" * 60)
    
    from app.services.response_formatter import format_table_with_ordering
    
    # Sample table data
    sample_table = {
        "id": "test_table",
        "title": "Top Breeds",
        "columns": ["breed_code", "count"],
        "rows": [
            ["ANGUS", 450],
            ["HEREFORD", 320],
            ["SIMMENTAL", 280],
        ],
    }
    
    # Test with ordering
    print("\nOriginal table:")
    print(f"  Columns: {sample_table['columns']}")
    for row in sample_table['rows']:
        print(f"  {row}")
    
    enhanced_table = format_table_with_ordering(sample_table, requires_ordering=True)
    
    print("\nEnhanced table (with ordering):")
    print(f"  Columns: {enhanced_table['columns']}")
    for row in enhanced_table['rows']:
        print(f"  {row}")
    
    # Validate
    assert enhanced_table['columns'][0] == "#", "First column should be row number"
    assert enhanced_table['rows'][0][0] == 1, "First row should be numbered 1"
    assert enhanced_table['rows'][1][0] == 2, "Second row should be numbered 2"
    
    print("\n✅ Table ordering test passed!")


if __name__ == "__main__":
    print("\n🚀 Running Intelligent Chat System Tests\n")
    
    try:
        test_query_intent_analysis()
        test_citation_filtering()
        test_table_ordering()
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        print("\nThe intelligent chat improvements are working correctly:")
        print("  ✅ Query intent analysis")
        print("  ✅ Smart citation filtering")
        print("  ✅ Automatic table numbering")
        print("\nDatabase queries will NOT show citations")
        print("Research queries WILL show citations")
        print("Tables will be numbered when appropriate")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
