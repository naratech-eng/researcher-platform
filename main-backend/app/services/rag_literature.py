"""RAG service for scientific literature retrieval.

Retrieves relevant scientific papers from arXiv and other sources
to support genetics research answers with citations.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
import time

import arxiv
import requests

try:
    from Bio import Entrez
    BIOPYTHON_AVAILABLE = True
except ImportError:
    BIOPYTHON_AVAILABLE = False
    Entrez = None

try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    chromadb = None
    ChromaSettings = None

from langchain_openai import OpenAIEmbeddings

from app.core.config import get_settings


class LiteratureRetriever:
    """Retrieves and searches scientific literature using RAG."""
    
    def __init__(self):
        """Initialize the literature retriever with ChromaDB."""
        settings = get_settings()
        
        # Initialize OpenAI embeddings
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=settings.openai_api_key
        )
        
        # Initialize ChromaDB client (optional - only used for future vector storage)
        self.chroma_client = None
        self.collection_name = "genetics_literature"
        
        if CHROMADB_AVAILABLE:
            try:
                # Store in ./chroma_db directory
                self.chroma_client = chromadb.Client(ChromaSettings(
                    persist_directory="./chroma_db",
                    anonymized_telemetry=False,
                ))
            except Exception:
                # ChromaDB not available or has compatibility issues
                pass
        
    def search_arxiv(
        self,
        query: str,
        max_results: int = 5,
    ) -> List[Dict[str, Any]]:
        """Search arXiv for relevant papers.
        
        Args:
            query: Search query
            max_results: Maximum number of results to return
        
        Returns:
            List of paper metadata dicts
        """
        try:
            # Search arXiv
            search = arxiv.Search(
                query=query,
                max_results=max_results,
                sort_by=arxiv.SortCriterion.Relevance
            )
            
            papers = []
            for result in search.results():
                paper = {
                    "title": result.title,
                    "authors": [author.name for author in result.authors],
                    "summary": result.summary,
                    "published": result.published.isoformat(),
                    "arxiv_id": result.entry_id.split('/')[-1],
                    "pdf_url": result.pdf_url,
                    "categories": result.categories,
                }
                papers.append(paper)
            
            return papers
            
        except Exception as e:
            print(f"arXiv search error: {e}")
            return []
    
    def search_pubmed(
        self,
        query: str,
        max_results: int = 5,
    ) -> List[Dict[str, Any]]:
        """Search PubMed/NCBI for relevant papers.
        
        Args:
            query: Search query
            max_results: Maximum number of results to return
        
        Returns:
            List of paper metadata dicts
        """
        if not BIOPYTHON_AVAILABLE:
            print("Biopython not available for PubMed search")
            return []
        
        settings = get_settings()
        
        # NCBI requires email for API access (policy)
        if not settings.ncbi_email:
            print("NCBI_EMAIL not configured - skipping PubMed search")
            return []
        
        try:
            # Configure Entrez
            Entrez.email = settings.ncbi_email
            if settings.ncbi_api_key:
                Entrez.api_key = settings.ncbi_api_key
            
            # Search PubMed
            search_handle = Entrez.esearch(
                db="pubmed",
                term=query,
                retmax=max_results,
                sort="relevance"
            )
            search_results = Entrez.read(search_handle)
            search_handle.close()
            
            id_list = search_results["IdList"]
            
            if not id_list:
                return []
            
            # Fetch details for the papers
            # Add delay to respect NCBI rate limits
            # With API key: 10 req/sec = 0.1s delay
            # Without API key: 3 req/sec = 0.34s delay
            delay = 0.1 if settings.ncbi_api_key else 0.34
            time.sleep(delay)
            
            fetch_handle = Entrez.efetch(
                db="pubmed",
                id=id_list,
                rettype="medline",
                retmode="text"
            )
            papers_data = fetch_handle.read()
            fetch_handle.close()
            
            # Parse the results (simplified - you may want more detailed parsing)
            papers = []
            for pmid in id_list:
                # Fetch individual paper details with rate limit delay
                time.sleep(delay)
                
                try:
                    summary_handle = Entrez.esummary(db="pubmed", id=pmid)
                    summary = Entrez.read(summary_handle)
                    summary_handle.close()
                    
                    if summary:
                        paper_info = summary[0]
                        
                        # Parse authors - handle both dict and string formats
                        author_list = paper_info.get("AuthorList", [])
                        authors = []
                        for author in author_list:
                            if isinstance(author, dict):
                                authors.append(author.get("Name", ""))
                            elif isinstance(author, str):
                                authors.append(author)
                            else:
                                # Handle StringElement or other types
                                authors.append(str(author))
                        
                        paper = {
                            "title": paper_info.get("Title", ""),
                            "authors": authors,
                            "summary": paper_info.get("Source", ""),  # PubMed doesn't always have abstracts in summary
                            "published": paper_info.get("PubDate", ""),
                            "pmid": pmid,
                            "doi": paper_info.get("DOI", ""),
                            "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                        }
                        papers.append(paper)
                except Exception as e:
                    print(f"Error fetching PubMed paper {pmid}: {e}")
                    continue
            
            return papers
            
        except Exception as e:
            print(f"PubMed search error: {e}")
            return []
    
    def search_nature(
        self,
        query: str,
        max_results: int = 5,
    ) -> List[Dict[str, Any]]:
        """Search Nature journals for relevant papers.
        
        Args:
            query: Search query
            max_results: Maximum number of results to return
        
        Returns:
            List of paper metadata dicts
        """
        settings = get_settings()
        
        if not settings.nature_api_key:
            print("NATURE_API_KEY not configured - skipping Nature search")
            return []
        
        try:
            # Nature API endpoint
            url = "https://api.springernature.com/meta/v2/json"
            
            params = {
                "q": query,
                "p": max_results,
                "api_key": settings.nature_api_key,
            }
            
            # Increased timeout for slower API responses
            response = requests.get(url, params=params, timeout=20)
            
            if response.status_code != 200:
                print(f"Nature API error: {response.status_code}")
                return []
            
            data = response.json()
            records = data.get("records", [])
            
            papers = []
            for record in records[:max_results]:
                paper = {
                    "title": record.get("title", ""),
                    "authors": [creator.get("creator", "") for creator in record.get("creators", [])],
                    "summary": record.get("abstract", ""),
                    "published": record.get("publicationDate", ""),
                    "doi": record.get("doi", ""),
                    "url": record.get("url", ""),
                    "journal": record.get("publicationName", "Nature"),
                }
                papers.append(paper)
            
            return papers
            
        except Exception as e:
            print(f"Nature search error: {e}")
            return []
    
    def search_genetics_topics(
        self,
        user_question: str,
    ) -> List[Dict[str, Any]]:
        """Search for relevant genetics literature based on user question.
        
        Args:
            user_question: The user's question
        
        Returns:
            List of relevant papers with citations
        """
        # Extract genetics-related keywords
        question_lower = user_question.lower()
        
        # Build search query based on question
        search_terms = []
        
        if any(kw in question_lower for kw in ["gwas", "genome-wide"]):
            search_terms.append("genome-wide association study")
        
        if any(kw in question_lower for kw in ["snp", "variant", "mutation"]):
            search_terms.append("genetic variant SNP")
        
        if any(kw in question_lower for kw in ["trait", "phenotype"]):
            search_terms.append("quantitative trait genetics")
        
        if any(kw in question_lower for kw in ["breed", "breeding"]):
            search_terms.append("animal breeding genomics")
        
        if any(kw in question_lower for kw in ["heritability", "genetic correlation"]):
            search_terms.append("heritability genetic correlation")
        
        # Default to general genetics query
        if not search_terms:
            search_terms.append("quantitative genetics genomics")
        
        # Search across multiple sources
        # Target: 15-20 citations total from all sources
        all_papers = []
        
        # 1. Search arXiv (open access, no key needed)
        # Get ~6-8 papers from arXiv
        for term in search_terms[:2]:  # Top 2 most specific terms
            papers = self.search_arxiv(f"cat:q-bio.GN {term}", max_results=4)
            for paper in papers:
                paper['source'] = 'arXiv'
                paper['paper_id'] = paper.get('arxiv_id', '')
            all_papers.extend(papers)
        
        # 2. Search PubMed (if configured)
        # Get ~8-10 papers from PubMed (most comprehensive genetics database)
        settings = get_settings()
        if settings.ncbi_email:
            # Use extended time for rate-limited requests (with API key: 10 req/sec)
            for term in search_terms[:2]:  # Top 2 terms
                papers = self.search_pubmed(f"{term} AND genetics[MeSH]", max_results=5)
                for paper in papers:
                    paper['source'] = 'PubMed'
                    paper['paper_id'] = paper.get('pmid', '')
                all_papers.extend(papers)
        
        # 3. Search Nature (if configured)
        # Get ~6-8 papers from Nature/Springer
        if settings.nature_api_key:
            for term in search_terms[:2]:  # Top 2 terms
                papers = self.search_nature(f"{term} genetics", max_results=4)
                for paper in papers:
                    paper['source'] = 'Nature'
                    paper['paper_id'] = paper.get('doi', '')
                all_papers.extend(papers)
        
        # Remove duplicates based on paper_id
        unique_papers = {}
        for paper in all_papers:
            paper_id = paper.get('paper_id', '')
            if paper_id and paper_id not in unique_papers:
                unique_papers[paper_id] = paper
        
        # Return top 20 from all sources (ensures at least 10, usually 15-20)
        return list(unique_papers.values())[:20]
    
    def format_citations(
        self,
        papers: List[Dict[str, Any]],
    ) -> List[Dict[str, str]]:
        """Format papers as citations for the /chat response.
        
        Args:
            papers: List of paper metadata dicts
        
        Returns:
            List of citation dicts for the citations artifact
        """
        citations = []
        
        for paper in papers:
            # Format authors (first author + et al. if more than 2)
            authors = paper["authors"]
            if len(authors) > 2:
                author_str = f"{authors[0]} et al."
            elif len(authors) == 2:
                author_str = f"{authors[0]} & {authors[1]}"
            else:
                author_str = ", ".join(authors)
            
            # Get source-specific identifiers
            source = paper.get("source", "arXiv")
            paper_id = paper.get("paper_id", "")
            
            # Determine URL based on source
            if source == "PubMed":
                url = paper.get("url", f"https://pubmed.ncbi.nlm.nih.gov/{paper.get('pmid', '')}/")
            elif source == "Nature":
                url = paper.get("url", "")
            else:  # arXiv
                url = paper.get("pdf_url", paper.get("url", ""))
            
            # Truncate summary
            summary = paper.get("summary", "")
            if len(summary) > 200:
                summary = summary[:200] + "..."
            
            citation = {
                "id": paper_id or paper.get("arxiv_id", paper.get("pmid", paper.get("doi", ""))),
                "title": paper.get("title", ""),
                "authors": author_str,
                "source": source,
                "url": url,
                "summary": summary,
                "published": paper.get("published", ""),
            }
            
            # Add DOI if available
            if paper.get("doi"):
                citation["doi"] = paper["doi"]
            
            citations.append(citation)
        
        return citations


def retrieve_literature_for_question(
    user_question: str,
) -> Optional[Dict[str, Any]]:
    """Main function to retrieve literature for a user question.
    
    Args:
        user_question: The user's question
    
    Returns:
        Dict with papers and formatted citations, or None
    """
    settings = get_settings()
    
    if not settings.has_rag:
        return None
    
    try:
        retriever = LiteratureRetriever()
        papers = retriever.search_genetics_topics(user_question)
        
        if not papers:
            return None
        
        citations = retriever.format_citations(papers)
        
        return {
            "papers": papers,
            "citations": citations,
        }
        
    except Exception as e:
        print(f"Literature retrieval error: {e}")
        return None
