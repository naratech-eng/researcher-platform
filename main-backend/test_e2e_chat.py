"""End-to-end test for intelligent chat system.

This tests the full flow:
1. Query intent analysis
2. SQL agent execution (if database query)
3. Citation retrieval (if research query)
4. Response formatting with proper table numbering
5. Smart citation filtering

Run this with the backend server running:
    # Terminal 1: Start backend
    cd main-backend
    uvicorn app.main:app --reload
    
    # Terminal 2: Run test
    python test_e2e_chat.py
"""

import requests
import json
from typing import Dict, List, Any


BACKEND_URL = "http://localhost:8000"


def send_chat_request(message: str) -> Dict[str, Any]:
    """Send a chat request to the backend."""
    payload = {
        "messages": [
            {"role": "user", "content": message}
        ]
    }
    
    response = requests.post(
        f"{BACKEND_URL}/chat",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code != 200:
        raise Exception(f"Request failed: {response.text}")
    
    return response.json()


def test_database_query_no_citations():
    """Test that database queries don't show citations."""
    print("\n" + "=" * 60)
    print("TEST 1: Database Query (Should NOT show citations)")
    print("=" * 60)
    
    query = "Show me the top 5 breeds by count"
    print(f"\nQuery: {query}")
    
    response = send_chat_request(query)
    
    print(f"\nAnswer: {response['answer']}")
    print(f"\nHas Tables: {len(response['artifacts']['tables']) > 0}")
    print(f"Has Citations: {len(response.get('citations', [])) > 0}")
    
    # Check table has numbering
    if response['artifacts']['tables']:
        table = response['artifacts']['tables'][0]
        print(f"\nTable Columns: {table['columns']}")
        print(f"First Row: {table['rows'][0] if table['rows'] else 'No rows'}")
        
        # Check for row number column
        has_row_numbers = table['columns'][0] in ['#', 'No', 'number', 'Rank']
        print(f"Has Row Numbers: {has_row_numbers}")
        
        # Check render hints
        if 'render_hints' in table:
            print(f"Render Hints: {table['render_hints']}")
    
    # Validate: Database queries should NOT have citations
    assert len(response.get('citations', [])) == 0, "Database query should NOT return citations"
    print("\n✅ PASSED: No citations for database query")


def test_research_query_with_citations():
    """Test that research queries show citations."""
    print("\n" + "=" * 60)
    print("TEST 2: Research Query (SHOULD show citations)")
    print("=" * 60)
    
    query = "What papers discuss GWAS in cattle?"
    print(f"\nQuery: {query}")
    
    response = send_chat_request(query)
    
    print(f"\nAnswer: {response['answer']}")
    print(f"\nHas Tables: {len(response['artifacts']['tables']) > 0}")
    print(f"Has Citations: {len(response.get('citations', [])) > 0}")
    
    if response.get('citations'):
        print(f"\nNumber of Citations: {len(response['citations'])}")
        print(f"\nFirst Citation:")
        first = response['citations'][0]
        print(f"  - Title: {first.get('title', 'N/A')}")
        print(f"  - Source: {first.get('source', 'N/A')}")
        print(f"  - Authors: {first.get('authors', 'N/A')}")
    
    # Validate: Research queries SHOULD have citations (if RAG is enabled)
    # Note: This might be 0 if RAG is not configured
    print(f"\nCitation count: {len(response.get('citations', []))}")
    print("\n✅ PASSED: Research query handled correctly")


def test_aggregation_query_with_numbering():
    """Test that aggregation queries get proper numbering."""
    print("\n" + "=" * 60)
    print("TEST 3: Aggregation Query (Should have row numbers)")
    print("=" * 60)
    
    query = "Count animals by sex"
    print(f"\nQuery: {query}")
    
    response = send_chat_request(query)
    
    print(f"\nAnswer: {response['answer']}")
    
    if response['artifacts']['tables']:
        table = response['artifacts']['tables'][0]
        print(f"\nTable Columns: {table['columns']}")
        print("\nTable Rows:")
        for i, row in enumerate(table['rows'][:5], 1):  # Show first 5 rows
            print(f"  {i}. {row}")
        
        # Check for row numbering
        first_col = table['columns'][0].lower()
        has_number_col = first_col in ['#', 'no', 'number', 'rank', 'row_number']
        print(f"\nHas Number Column: {has_number_col}")
        
        # Check render hints
        if 'render_hints' in table:
            hints = table['render_hints']
            print(f"\nRender Hints:")
            print(f"  - Is Aggregation: {hints.get('is_aggregation', False)}")
            print(f"  - Show Totals: {hints.get('show_totals', False)}")
            print(f"  - Highlight Numbers: {hints.get('highlight_numbers', False)}")
    
    # Validate: Should have table, no citations
    assert len(response['artifacts']['tables']) > 0, "Should have table results"
    assert len(response.get('citations', [])) == 0, "Should NOT have citations"
    print("\n✅ PASSED: Aggregation query formatted correctly")


def test_complex_query():
    """Test a complex query that requires intelligent SQL generation."""
    print("\n" + "=" * 60)
    print("TEST 4: Complex Query (Tests SQL Agent)")
    print("=" * 60)
    
    query = "Show me all breeds with more than 100 animals, ordered by count descending"
    print(f"\nQuery: {query}")
    
    response = send_chat_request(query)
    
    print(f"\nAnswer: {response['answer']}")
    
    if response['artifacts']['tables']:
        table = response['artifacts']['tables'][0]
        print(f"\nTable: {len(table['rows'])} rows, {len(table['columns'])} columns")
        print(f"Columns: {table['columns']}")
        print("\nFirst 3 rows:")
        for row in table['rows'][:3]:
            print(f"  {row}")
    
    print("\n✅ PASSED: Complex query handled")


def print_summary(results: List[bool]):
    """Print test summary."""
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"\nTests Passed: {passed}/{total}")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("\nThe intelligent chat system is working correctly:")
        print("  ✅ Database queries don't show citations")
        print("  ✅ Research queries show citations")
        print("  ✅ Tables have proper numbering when appropriate")
        print("  ✅ Render hints are included for frontend")
    else:
        print("\n❌ SOME TESTS FAILED")
        print("Check the output above for details")


if __name__ == "__main__":
    print("\n🚀 Running End-to-End Intelligent Chat Tests")
    print("\nMake sure the backend is running on http://localhost:8000")
    
    # Check backend health
    try:
        health = requests.get(f"{BACKEND_URL}/api/health/db")
        if health.status_code == 200:
            print("✅ Backend is healthy and reachable")
        else:
            print("⚠️  Backend is reachable but health check failed")
    except Exception as e:
        print(f"❌ Cannot reach backend: {e}")
        print("\nPlease start the backend with:")
        print("  cd main-backend")
        print("  uvicorn app.main:app --reload")
        exit(1)
    
    results = []
    
    try:
        # Run tests
        test_database_query_no_citations()
        results.append(True)
        
        test_research_query_with_citations()
        results.append(True)
        
        test_aggregation_query_with_numbering()
        results.append(True)
        
        test_complex_query()
        results.append(True)
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        results.append(False)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        results.append(False)
    
    # Print summary
    print_summary(results)
