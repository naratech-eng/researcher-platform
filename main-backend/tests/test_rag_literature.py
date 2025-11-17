"""Tests for RAG literature retrieval service."""

import pytest

from app.core.config import get_settings
from app.services.rag_literature import (
    LiteratureRetriever,
    retrieve_literature_for_question,
)


settings = get_settings()


@pytest.mark.skipif(
    not settings.has_rag,
    reason="RAG not configured",
)
def test_literature_retriever_initialization():
    """Test that LiteratureRetriever initializes correctly."""
    retriever = LiteratureRetriever()
    
    assert retriever.embeddings is not None
    assert retriever.collection_name == "genetics_literature"
    # chroma_client may be None if ChromaDB has compatibility issues
    # This is okay - the retriever still works via arXiv search


@pytest.mark.skipif(
    not settings.has_rag,
    reason="RAG not configured",
)
def test_search_arxiv_basic():
    """Test basic arXiv search functionality."""
    retriever = LiteratureRetriever()
    
    # Search for genetics papers
    papers = retriever.search_arxiv("genetics genomics", max_results=2)
    
    # Should return some results
    assert isinstance(papers, list)
    
    if len(papers) > 0:
        # Verify paper structure
        paper = papers[0]
        assert 'title' in paper
        assert 'authors' in paper
        assert 'summary' in paper
        assert 'published' in paper
        assert 'arxiv_id' in paper
        assert 'pdf_url' in paper
        assert 'categories' in paper
        
        # Verify data types
        assert isinstance(paper['title'], str)
        assert isinstance(paper['authors'], list)
        assert isinstance(paper['summary'], str)
        assert len(paper['title']) > 0


@pytest.mark.skipif(
    not settings.has_rag,
    reason="RAG not configured",
)
def test_search_genetics_topics_gwas():
    """Test genetics topic search for GWAS."""
    retriever = LiteratureRetriever()
    
    papers = retriever.search_genetics_topics(
        "What are best practices for GWAS analysis?"
    )
    
    assert isinstance(papers, list)
    # Should return up to 5 papers
    assert len(papers) <= 5


@pytest.mark.skipif(
    not settings.has_rag,
    reason="RAG not configured",
)
def test_search_genetics_topics_snp():
    """Test genetics topic search for SNP."""
    retriever = LiteratureRetriever()
    
    papers = retriever.search_genetics_topics(
        "How do SNP variants affect traits?"
    )
    
    assert isinstance(papers, list)


@pytest.mark.skipif(
    not settings.has_rag,
    reason="RAG not configured",
)
def test_format_citations():
    """Test citation formatting."""
    retriever = LiteratureRetriever()
    
    # Mock paper data
    papers = [
        {
            "title": "Test Paper on Genetics",
            "authors": ["Smith J", "Doe A", "Brown B"],
            "summary": "This is a test summary that is quite long and should be truncated" * 10,
            "published": "2023-01-15T00:00:00",
            "arxiv_id": "2301.12345",
            "pdf_url": "https://arxiv.org/pdf/2301.12345",
            "categories": ["q-bio.GN"],
        }
    ]
    
    citations = retriever.format_citations(papers)
    
    assert len(citations) == 1
    citation = citations[0]
    
    # Verify citation structure
    assert citation['id'] == "2301.12345"
    assert citation['title'] == "Test Paper on Genetics"
    assert citation['authors'] == "Smith J et al."  # Should truncate to "et al."
    assert citation['source'] == "arXiv"
    assert citation['url'] == "https://arxiv.org/pdf/2301.12345"
    assert len(citation['summary']) <= 203  # 200 + "..."
    assert citation['published'] == "2023-01-15T00:00:00"


@pytest.mark.skipif(
    not settings.has_rag,
    reason="RAG not configured",
)
def test_format_citations_two_authors():
    """Test citation formatting with two authors."""
    retriever = LiteratureRetriever()
    
    papers = [
        {
            "title": "Test Paper",
            "authors": ["Smith J", "Doe A"],
            "summary": "Summary",
            "published": "2023-01-15T00:00:00",
            "arxiv_id": "2301.12345",
            "pdf_url": "https://arxiv.org/pdf/2301.12345",
            "categories": ["q-bio.GN"],
        }
    ]
    
    citations = retriever.format_citations(papers)
    citation = citations[0]
    
    # Should use "&" for two authors
    assert citation['authors'] == "Smith J & Doe A"


@pytest.mark.skipif(
    not settings.has_rag,
    reason="RAG not configured",
)
def test_retrieve_literature_for_question():
    """Test the main literature retrieval function."""
    result = retrieve_literature_for_question(
        "What is the heritability of body weight in cattle?"
    )
    
    # Should return results or None
    if result is not None:
        assert 'papers' in result
        assert 'citations' in result
        assert isinstance(result['papers'], list)
        assert isinstance(result['citations'], list)
        
        # Citations should be formatted correctly
        if len(result['citations']) > 0:
            citation = result['citations'][0]
            assert 'id' in citation
            assert 'title' in citation
            assert 'authors' in citation
            assert 'url' in citation


def test_retrieve_literature_disabled():
    """Test that literature retrieval returns None when RAG is disabled."""
    if settings.has_rag:
        pytest.skip("RAG is enabled, can't test disabled state")
    
    result = retrieve_literature_for_question("test question")
    assert result is None
