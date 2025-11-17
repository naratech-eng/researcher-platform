# LangChain SQL Agent for Natural Language Queries

## Overview

The `/chat` endpoint now uses a **LangChain SQL Agent** to convert natural language questions into SQL queries automatically—just like the MCP dbhub server. No hardcoded patterns or filters needed.

## How It Works

1. User asks a question like: `"Show me all animals with breed code MC"`
2. SQL Agent:
   - Analyzes the genetics database schema automatically
   - Converts the question to SQL: `SELECT * FROM animals WHERE breed_code = 'MC'`
   - Executes the query safely
   - Returns results as structured table artifacts
3. LangChain summarizer (if enabled) explains the results in natural language

## Setup

### 1. Install Dependencies

```bash
cd main-backend
source venv/bin/activate
pip install -r requirements.txt
```

This installs:
- `langchain-community` (SQL database tools)
- `langchain-core` (prompts and chains)
- `langchain-openai` (OpenAI integration)

### 2. Configure Environment Variables

In `main-backend/.env`:

```env
# PostgreSQL connection
MAIN_BACKEND_DB_HOST=genetic-pg.ct2eug022ja6.us-east-2.rds.amazonaws.com
MAIN_BACKEND_DB_PORT=5432
MAIN_BACKEND_DB_NAME=genetic_db
MAIN_BACKEND_DB_USER=genetic_admin
MAIN_BACKEND_DB_PASSWORD=your_password_here

# OpenAI for SQL Agent
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # or gpt-5.1
MAIN_BACKEND_USE_LLM_IN_CHAT=true

# Optional: Data-aware table summarization
MAIN_BACKEND_USE_LANGCHAIN_SUMMARIZER=true
```

### 3. Start the Server

```bash
set -a
source .env
set +a
uvicorn app.main:app --reload
```

## Example Queries

The SQL Agent can handle ANY question about the genetics database:

```bash
curl -s http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Show me the first 10 animals"}
    ]
  }' | jq .
```

```bash
curl -s http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What distinct breed codes are in the database?"}
    ]
  }' | jq .
```

```bash
curl -s http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Count animals grouped by sex"}
    ]
  }' | jq .
```

## Safety Features

- **Read-only**: The agent can only execute SELECT queries (no INSERT/UPDATE/DELETE)
- **Timeout**: Queries timeout after 10 seconds
- **Max iterations**: Agent limited to 5 reasoning steps to avoid runaway queries
- **Sample rows**: Agent sees 3 sample rows per table for context

## How Intent Detection Works

The `/chat` endpoint detects genetics queries by looking for keywords:
- `database`, `genetics`, `animal`, `trait`, `breed`, `query`, `sql`

If detected → SQL Agent is invoked  
Otherwise → Regular echo/chat response

## Architecture

```
User Question
    ↓
/chat endpoint (chat.py)
    ↓
genetics_sql_agent.py
    ↓
LangChain SQL Agent
    ↓
PostgreSQL Database
    ↓
Table Artifact (JSON)
    ↓
LangChain Summarizer (optional)
    ↓
Final Answer + Artifacts
```

## Next Steps

- Add more sophisticated table result parsing
- Support aggregations and complex queries
- Add query result caching
- Extend to support chart generation from query results
