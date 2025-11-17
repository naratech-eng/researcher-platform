# Enhanced Features Guide - Researcher Platform

## Overview

The main-backend `/chat` endpoint now supports comprehensive research capabilities:

✅ **Natural language SQL queries** (LangChain SQL Agent)  
✅ **Data-aware responses** (LangChain summarization)  
✅ **Interactive charts** (Plotly - all chart types)  
✅ **Statistical analysis** (regression, random forest, Q-Q plots, etc.)  
✅ **Scientific literature** (arXiv citations via RAG)  
✅ **Copyable code snippets** (with syntax highlighting)  

**ALL FEATURES ENABLED BY DEFAULT** - Users can disable via environment variables.

---

## Feature Flags

All features are **enabled by default** in `.env`:

```env
# Users can disable any feature by setting to "false"
MAIN_BACKEND_USE_LLM_IN_CHAT=true
MAIN_BACKEND_USE_LANGCHAIN_SUMMARIZER=true
MAIN_BACKEND_USE_CHARTS=true
MAIN_BACKEND_USE_RAG=true
MAIN_BACKEND_USE_STATISTICAL_ANALYSIS=true
MAIN_BACKEND_USE_CODE_SNIPPETS=true
```

---

## 1. Copyable Code Snippets

### What It Does
Returns formatted, syntax-highlighted code blocks that users can copy directly from the chat interface.

### Usage
Code snippets are automatically included when:
- Statistical analysis is performed
- SQL queries are generated
- Mathematical functions are explained

### Artifact Format

```json
{
  "code_snippets": [
    {
      "id": "snippet_linear_reg_1234",
      "language": "python",
      "title": "Linear Regression Analysis",
      "code": "import pandas as pd\nfrom sklearn.linear_model import LinearRegression\n..."
    }
  ]
}
```

### Example Request

```bash
curl -s http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Perform linear regression on animal weight vs age"}
    ]
  }' | jq '.artifacts.code_snippets'
```

### Next.js Integration

```typescript
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

function CodeSnippet({ snippet }: { snippet: any }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(snippet.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-snippet">
      <div className="flex justify-between items-center mb-2">
        <h4>{snippet.title}</h4>
        <button onClick={copyToClipboard}>
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      <SyntaxHighlighter language={snippet.language} style={vscDarkPlus}>
        {snippet.code}
      </SyntaxHighlighter>
    </div>
  )
}

// In your chat component
{message.artifacts.code_snippets.map(snippet => (
  <CodeSnippet key={snippet.id} snippet={snippet} />
))}
```

---

## 2. Statistical Analysis

### Supported Analyses

1. **Linear Regression** - Simple regression between two variables
2. **Multiple Regression** - Multiple independent variables
3. **Random Forest** - Non-linear modeling with feature importance
4. **Q-Q Plot** - Normality testing
5. **Correlation Analysis** - Pearson/Spearman correlations
6. **ANOVA** - Analysis of variance

### Example Requests

#### Linear Regression

```bash
curl -s http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Run linear regression analysis on animal data"}
    ]
  }'
```

#### Random Forest

```bash
curl -s http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Perform random forest analysis to predict traits"}
    ]
  }'
```

#### Q-Q Plot

```bash
curl -s http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Create a Q-Q plot to test normality of birth weights"}
    ]
  }'
```

### Response Structure

```json
{
  "answer": "I performed a linear regression analysis...",
  "artifacts": {
    "charts": [{
      "id": "chart_regression_1234",
      "chart_type": "scatter",
      "figure": {...}
    }],
    "code_snippets": [{
      "id": "snippet_analysis_1234",
      "language": "python",
      "code": "# Linear Regression\nimport pandas as pd\n..."
    }]
  }
}
```

---

## 3. Scientific Literature (RAG)

### What It Does
Automatically searches arXiv and other scientific databases to find relevant papers that support the answer.

### How It Works

1. Extracts keywords from user question (e.g., "GWAS", "heritability", "SNP")
2. Searches arXiv genetics category (`q-bio.GN`)
3. Returns top 5 most relevant papers
4. Adds formatted citations to response

### Example Request

```bash
curl -s http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What are best practices for GWAS analysis in livestock?"}
    ]
  }' | jq '.citations'
```

### Response Structure

```json
{
  "answer": "GWAS analysis in livestock...",
  "citations": [
    {
      "id": "2301.12345",
      "title": "Genome-wide association studies in cattle...",
      "authors": "Smith J et al.",
      "source": "arXiv",
      "url": "https://arxiv.org/pdf/2301.12345",
      "summary": "This study presents...",
      "published": "2023-01-15T00:00:00"
    }
  ]
}
```

### Next.js Integration

```typescript
function Citations({ citations }: { citations: any[] }) {
  return (
    <div className="citations mt-4">
      <h4 className="font-semibold">Scientific References:</h4>
      {citations.map(cite => (
        <div key={cite.id} className="citation-card p-3 border rounded mt-2">
          <a href={cite.url} target="_blank" className="text-blue-600 hover:underline">
            {cite.title}
          </a>
          <p className="text-sm text-gray-600">{cite.authors}</p>
          <p className="text-xs text-gray-500">{cite.source} • {cite.published}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## 4. Files Artifact

### What `files[]` Means

The `files` array contains downloadable/viewable file artifacts generated by the system:

```json
{
  "files": [
    {
      "id": "file_export_1234",
      "filename": "analysis_results.csv",
      "url": "/api/download/1234",
      "mime_type": "text/csv",
      "size_bytes": 12345,
      "description": "Exported regression results"
    }
  ]
}
```

### Supported File Types

- **CSV/Excel** - Data exports
- **PDF** - Generated reports
- **PNG/SVG** - Chart image exports
- **JSON** - Raw analysis results

### Example: Export Chart as Image

```bash
curl -s http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Create a bar chart and export it as PNG"}
    ]
  }'
```

---

## 5. Mathematical Functions

### LaTeX Support

Mathematical formulas are returned in LaTeX format for proper rendering:

```json
{
  "answer": "The regression equation is: $$y = 2.5x + 10.3$$\n\nWhere:\n- Coefficient (slope): $2.5$\n- Intercept: $10.3$\n- R²: $0.87$"
}
```

### Next.js Integration with KaTeX

```typescript
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

function MathContent({ content }: { content: string }) {
  // Parse and render LaTeX
  const parts = content.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/)
  
  return (
    <div>
      {parts.map((part, i) => {
        if (part.startsWith('$$')) {
          return <BlockMath key={i}>{part.slice(2, -2)}</BlockMath>
        } else if (part.startsWith('$')) {
          return <InlineMath key={i}>{part.slice(1, -1)}</InlineMath>
        }
        return <span key={i}>{part}</span>
      })}
    </div>
  )
}
```

---

## Complete Example: Full-Featured Request

```bash
curl -s http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Analyze the relationship between animal birth weight and genetic markers. Include a regression analysis with scientific literature support."
      }
    ]
  }' | jq .
```

### Expected Response

```json
{
  "answer": "I performed a linear regression analysis...\n\nThe regression equation is: $$y = 0.45x + 2.1$$\n\nThis is supported by recent research on livestock genetics...",
  "artifacts": {
    "tables": [{
      "id": "genetics_query_result",
      "columns": ["marker_id", "birth_weight", "genotype"],
      "rows": [...]
    }],
    "charts": [{
      "id": "chart_regression_5678",
      "chart_type": "scatter",
      "title": "Birth Weight vs Genetic Marker",
      "figure": {...}
    }],
    "code_snippets": [{
      "id": "snippet_regression_1234",
      "language": "python",
      "title": "Reproducible Analysis Code",
      "code": "import pandas as pd\nfrom sklearn.linear_model import LinearRegression\n..."
    }],
    "files": []
  },
  "citations": [
    {
      "id": "2301.12345",
      "title": "Genetic markers associated with birth weight in cattle",
      "authors": "Johnson A et al.",
      "source": "arXiv",
      "url": "https://arxiv.org/pdf/2301.12345"
    }
  ]
}
```

---

## Architecture

```
User Question
    ↓
Intent Detection (keywords, patterns)
    ↓
┌─────────────────────────────────────┐
│  Parallel Tool Execution:           │
│  • SQL Agent (data retrieval)       │
│  • Chart Generator (visualization)  │
│  • Statistical Analysis (if needed) │
│  • Literature Retriever (RAG)       │
└─────────────────────────────────────┘
    ↓
LangChain Summarizer (data-aware answer)
    ↓
Response Assembly:
  • answer (text with LaTeX)
  • artifacts (tables, charts, code)
  • citations (scientific papers)
    ↓
Next.js Frontend Rendering
```

---

## Next Steps

1. **Install new dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Restart server**:
   ```bash
   uvicorn app.main:app --reload
   ```

3. **Test features**:
   ```bash
   pytest tests/ -v
   ```

4. **Integrate in Next.js** (see code examples above)

---

## Feature Toggle (Disabling Features)

To disable any feature, set its environment variable to `false`:

```env
# Disable statistical analysis
MAIN_BACKEND_USE_STATISTICAL_ANALYSIS=false

# Disable RAG/literature
MAIN_BACKEND_USE_RAG=false

# Disable code snippets
MAIN_BACKEND_USE_CODE_SNIPPETS=false
```

All features gracefully degrade when disabled - the system still works, just without those capabilities.
