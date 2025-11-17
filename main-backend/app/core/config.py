import os
from functools import lru_cache
from typing import Optional


class Settings:
    """Runtime configuration for the main-backend service.

    For now this is intentionally minimal. The primary setting we care
    about is the PostgreSQL connection string for the internal genetic DB.
    """

    def __init__(self) -> None:
        # Preferred: full DSN via env, e.g.:
        #   postgresql+psycopg2://user:password@host:5432/dbname
        dsn = os.getenv("MAIN_BACKEND_POSTGRES_DSN")

        # Fallback: construct DSN from individual env vars so that
        # username and password can be injected from Secrets Manager.
        if not dsn:
            host = os.getenv("MAIN_BACKEND_DB_HOST")
            port = os.getenv("MAIN_BACKEND_DB_PORT", "5432")
            name = os.getenv("MAIN_BACKEND_DB_NAME")
            user = os.getenv("MAIN_BACKEND_DB_USER")
            password = os.getenv("MAIN_BACKEND_DB_PASSWORD")

            if all([host, name, user, password]):
                dsn = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{name}"

        self.postgres_dsn: Optional[str] = dsn
        self.environment: str = os.getenv("MAIN_BACKEND_ENV", "dev")

        # OpenAI / ChatGPT configuration (optional)
        self.openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY")
        self.openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        
        # Scientific literature API keys (optional)
        self.ncbi_api_key: Optional[str] = os.getenv("NCBI_API_KEY")  # For PubMed access
        self.nature_api_key: Optional[str] = os.getenv("NATURE_API_KEY")  # For Nature journals
        self.ncbi_email: Optional[str] = os.getenv("NCBI_EMAIL")  # Required by NCBI API policy
        # Explicit feature flag so tests/dev can avoid hitting the LLM
        # ALL FEATURES ENABLED BY DEFAULT - users can disable via env vars
        self.use_llm_in_chat: bool = (
            os.getenv("MAIN_BACKEND_USE_LLM_IN_CHAT", "true").lower() == "true"
        )
        # Feature flag for LangChain-based table summarization
        # When enabled, LLM receives structured table data for richer explanations
        self.use_langchain_summarizer: bool = (
            os.getenv("MAIN_BACKEND_USE_LANGCHAIN_SUMMARIZER", "true").lower() == "true"
        )
        # Feature flag for Plotly chart generation
        # When enabled, generates interactive chart JSON from query results
        self.use_charts: bool = (
            os.getenv("MAIN_BACKEND_USE_CHARTS", "true").lower() == "true"
        )
        # Feature flag for RAG (Retrieval-Augmented Generation)
        # When enabled, retrieves scientific literature and docs to support answers
        self.use_rag: bool = (
            os.getenv("MAIN_BACKEND_USE_RAG", "true").lower() == "true"
        )
        # Feature flag for statistical analysis tools
        # When enabled, provides regression, random forest, Q-Q plots, etc.
        self.use_statistical_analysis: bool = (
            os.getenv("MAIN_BACKEND_USE_STATISTICAL_ANALYSIS", "true").lower() == "true"
        )
        # Feature flag for code snippet support
        # When enabled, returns formatted code blocks for copying
        self.use_code_snippets: bool = (
            os.getenv("MAIN_BACKEND_USE_CODE_SNIPPETS", "true").lower() == "true"
        )

    @property
    def has_postgres(self) -> bool:
        return bool(self.postgres_dsn)

    @property
    def has_llm(self) -> bool:
        return bool(self.openai_api_key) and self.use_llm_in_chat

    @property
    def has_langchain_summarizer(self) -> bool:
        return self.has_llm and self.use_langchain_summarizer

    @property
    def has_charts(self) -> bool:
        return self.has_postgres and self.use_charts

    @property
    def has_rag(self) -> bool:
        return self.has_llm and self.use_rag

    @property
    def has_statistical_analysis(self) -> bool:
        return self.has_postgres and self.use_statistical_analysis

    @property
    def has_code_snippets(self) -> bool:
        return self.use_code_snippets


@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings instance."""

    return Settings()
