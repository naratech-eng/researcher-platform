# Plotly Chart Generation for Genetics Data

## Overview

The `/chat` endpoint now supports generating interactive Plotly charts from genetics database queries. Charts are returned as Plotly JSON that can be rendered in Next.js using `react-plotly.js`.

## Supported Chart Types

The system supports **all major Plotly chart types**:

- **bar**: Bar charts for comparisons
- **line**: Line charts for trends over time
- **scatter**: Scatter plots for correlations
- **pie**: Pie charts for proportions
- **histogram**: Histograms for distributions
- **box**: Box plots for statistical analysis
- **violin**: Violin plots for distribution shapes
- **heatmap**: Heatmaps for matrices/correlations
- **area**: Area charts for cumulative data
- **funnel**: Funnel charts for conversion flows
- **sunburst**: Sunburst charts for hierarchical data
- **treemap**: Treemap charts for nested proportions

## Feature Flag

Charts are controlled by the `MAIN_BACKEND_USE_CHARTS` environment variable:

```env
MAIN_BACKEND_USE_CHARTS=true  # Enable chart generation
```

## How It Works

### 1. Intent Detection

The system detects chart requests using keywords:
- `chart`, `graph`, `plot`, `visualize`, `show distribution`

### 2. Query Execution

When charts are requested:
1. System executes a structured SQL query
2. Returns data with separate columns and rows
3. Generates both a table artifact AND a chart artifact

### 3. Chart Type Selection

The system intelligently selects chart types based on:
- **User intent**: Keywords like "trend" → line chart, "compare" → bar chart
- **Data structure**: Number of columns, row count, data types
- **Query patterns**: Aggregations, groupings, distributions

### 4. Chart Artifact Format

Charts are returned in the `artifacts.charts` array with this structure:

```json
{
  "id": "chart_bar_1234",
  "title": "Breed Distribution",
  "chart_type": "bar",
  "figure": {
    "data": [...],
    "layout": {...}
  }
}
```

The `figure` field contains the complete Plotly JSON specification, ready to render.

## Example Queries

### Count by Sex (Bar Chart)

```bash
curl -s http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Show me a chart of animal counts by sex"}
    ]
  }' | jq .
```

### Breed Distribution (Bar Chart)

```bash
curl -s http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Plot animal count by breed code"}
    ]
  }' | jq .
```

### Farmer Analysis (Bar Chart)

```bash
curl -s http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Visualize top 10 farmers by animal count"}
    ]
  }' | jq .
```

## Response Structure

When charts are generated, the response includes:

```json
{
  "answer": "Here are the results visualized as a chart, along with the data table.",
  "artifacts": {
    "tables": [
      {
        "id": "genetics_query_result",
        "title": "Query Results",
        "columns": ["sex", "count"],
        "rows": [["M", 1234], ["F", 1456]]
      }
    ],
    "charts": [
      {
        "id": "chart_bar_5678",
        "title": "Count Analysis",
        "chart_type": "bar",
        "figure": {
          "data": [{
            "x": ["M", "F"],
            "y": [1234, 1456],
            "type": "bar"
          }],
          "layout": {
            "title": "Count Analysis",
            "autosize": true,
            "margin": {"l": 50, "r": 50, "t": 80, "b": 50}
          }
        }
      }
    ],
    "files": []
  },
  "citations": []
}
```

## Next.js Frontend Integration

To render charts in your Next.js app:

### 1. Install Dependencies

```bash
npm install react-plotly.js plotly.js
# or
pnpm add react-plotly.js plotly.js
```

### 2. Create Chart Component

```typescript
// components/PlotlyChart.tsx
"use client"

import dynamic from 'next/dynamic'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

interface PlotlyChartProps {
  figure: any // Plotly JSON from backend
  title?: string
}

export function PlotlyChart({ figure, title }: PlotlyChartProps) {
  return (
    <div className="w-full">
      <Plot
        data={figure.data}
        layout={figure.layout}
        config={{ responsive: true }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
```

### 3. Render in Chat UI

```typescript
// In your chat message component
import { PlotlyChart } from '@/components/PlotlyChart'

function ChatMessage({ message }: { message: ChatResponse }) {
  return (
    <div>
      <p>{message.answer}</p>
      
      {/* Render tables */}
      {message.artifacts.tables.map(table => (
        <TableView key={table.id} table={table} />
      ))}
      
      {/* Render charts */}
      {message.artifacts.charts.map(chart => (
        <PlotlyChart
          key={chart.id}
          figure={chart.figure}
          title={chart.title}
        />
      ))}
    </div>
  )
}
```

## Architecture

```
User Query ("show chart of animals by sex")
    ↓
/chat endpoint (chat.py)
    ↓
Intent Detection (keywords: chart, plot, graph)
    ↓
genetics_sql_agent_structured.py
    ↓
Execute SQL query → Structured result {columns, rows}
    ↓
genetics_chart.py
    ↓
Generate Plotly chart → Plotly JSON
    ↓
Return artifacts: {tables: [...], charts: [...]}
    ↓
Next.js Frontend → react-plotly.js → Interactive chart
```

## Extending Chart Types

To add support for new chart patterns:

1. **Add SQL pattern** in `genetics_sql_agent_structured.py`:
   ```python
   elif "time series" in query_lower:
       sql_query = "SELECT date, count(*) FROM ... GROUP BY date"
   ```

2. **Add chart type suggestion** in `genetics_chart.py`:
   ```python
   if "time series" in intent_lower:
       return "line"
   ```

3. The system will automatically generate the appropriate chart!

## Testing

Run chart tests:

```bash
cd main-backend
source venv/bin/activate
set -a && source .env && set +a
pytest tests/test_chat_chart.py -v
```

## Future Enhancements

- [ ] Support for multi-series charts (stacked bars, grouped bars)
- [ ] Geographical charts (choropleth maps for farmer locations)
- [ ] 3D charts (3D scatter, surface plots)
- [ ] Animation support (time series animations)
- [ ] Custom color schemes and themes
- [ ] Export to PNG/SVG/PDF
- [ ] Interactive drill-down charts
