"""LLM-based summarization of retrieved literature for research answers.

This module takes the papers returned by the RAG literature retriever and
uses an LLM (via LangChain) to generate grounded answers that:
- Explain concepts (e.g., how to analyze GWAS)
- Reference patterns and findings from the retrieved papers
"""

from __future__ import annotations

import json
from typing import Any, Dict, List

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.core.config import get_settings


def summarize_literature_answer(
    user_question: str,
    papers: List[Dict[str, Any]],
    fallback_answer: str,
) -> str:
    """Generate a literature-grounded answer using the retrieved papers.

    Args:
        user_question: The user's research question (e.g. GWAS analysis)
        papers: List of paper metadata dicts from `retrieve_literature_for_question`
        fallback_answer: Text to return if LLM call fails

    Returns:
        A synthesized answer that uses the papers as evidence where possible.
    """
    settings = get_settings()

    # Require both RAG and LLM capabilities
    if not (settings.has_rag and settings.has_llm and settings.openai_api_key):
        return fallback_answer

    if not papers:
        return fallback_answer

    try:
        # Compact representation of the top N papers to keep tokens manageable
        max_papers = 8
        paper_summaries: List[Dict[str, Any]] = []

        for idx, paper in enumerate(papers[:max_papers], start=1):
            title = paper.get("title", "")
            authors = paper.get("authors", [])
            source = paper.get("source", "")
            published = paper.get("published", "")
            summary = paper.get("summary", "")

            # Authors can be list or string depending on source
            if isinstance(authors, list):
                if len(authors) > 3:
                    authors_str = ", ".join(authors[:3]) + " et al."
                else:
                    authors_str = ", ".join(authors)
            else:
                authors_str = str(authors)

            paper_summaries.append(
                {
                    "index": idx,
                    "title": title,
                    "authors": authors_str,
                    "source": source,
                    "published": published,
                    "summary": summary,
                }
            )

        # Format as JSON for the prompt
        papers_json = json.dumps(paper_summaries, indent=2)

        # Detect GWAS-style questions for more structured guidance
        question_lower = user_question.lower()
        is_gwas_question = "gwas" in question_lower or "genome-wide association" in question_lower

        # Build prompt
        if is_gwas_question:
            # Specialized instructions for GWAS questions: force a structured workflow
            prompt = ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        "You are a genetics research assistant. You are given a user's question about "
                        "genome-wide association studies (GWAS) and a set of relevant papers "
                        "(title, authors, source, short summary). Your job is to synthesize an answer that:",
                    ),
                    (
                        "system",
                        "- Briefly explains the typical GWAS workflow step by step, including:\n"
                        "  * study design and phenotypes\n"
                        "  * genotypes and quality control (filters, MAF, call rate)\n"
                        "  * population structure / relatedness (PCA, GRM)\n"
                        "  * association models (e.g., linear mixed models) and multiple testing control\n"
                        "  * interpretation of significant loci and follow-up\n"
                        "- Uses the provided papers as evidence for traits studied, models used, and recent trends\n"
                        "- Mentions specific ideas from the papers when possible (e.g., traits, sample sizes, models)\n"
                        "- Avoids fabricating details that are not supported by the summaries\n"
                        "- Is concise but insightful (around 2 short paragraphs)",
                    ),
                    (
                        "user",
                        "User question (about GWAS):\n{question}\n\n"
                        "Relevant GWAS papers (JSON list):\n{papers}\n\n"
                        "Using ONLY the information you can reasonably infer from these papers and general "
                        "domain knowledge, write an answer that:\n"
                        "1) Explains how GWAS is typically analyzed, step by step; and\n"
                        "2) Highlights what recent GWAS studies in these papers have done (traits, models, etc.).",
                    ),
                ]
            )
        else:
            # Generic literature-grounded answer
            prompt = ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        "You are a genetics research assistant. You are given a user's question "
                        "and a set of relevant papers (title, authors, source, short summary). "
                        "Your job is to synthesize an answer that:",
                    ),
                    (
                        "system",
                        "- Directly answers the user's question in clear language\n"
                        "- Uses the papers as evidence for methods, trends, and recent findings\n"
                        "- Mentions specific ideas from the papers (e.g., study types, traits, models)\n"
                        "- Avoids fabricating details that are not supported by the provided summaries\n"
                        "- Is concise but insightful (1-3 short paragraphs)",
                    ),
                    (
                        "user",
                        "User question:\n{question}\n\n"
                        "Relevant papers (JSON list):\n{papers}\n\n"
                        "Using ONLY the information you can reasonably infer from these papers and general "
                        "domain knowledge, write an answer that explains the key concepts and highlights "
                        "what recent studies have done.",
                    ),
                ]
            )

        llm = ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=0.4,
        )

        chain = prompt | llm
        result = chain.invoke({"question": user_question, "papers": papers_json})

        content = result.content if hasattr(result, "content") else str(result)
        return content or fallback_answer

    except Exception:
        # Fall back gracefully to avoid breaking /chat
        return fallback_answer
