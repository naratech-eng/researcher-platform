# Citation URL Display Fix

## Issue: [object Object] Instead of URLs

### Problem
Citations from Nature API were displaying `[object Object]` instead of clickable URLs.

### Root Cause
The backend returns citation URLs in **two different formats**:

**Format 1: String (arXiv, PubMed)**
```json
{
  "url": "https://arxiv.org/pdf/0802.1668v1"
}
```

**Format 2: Array of Objects (Nature)**
```json
{
  "url": [
    {
      "format": "html",
      "platform": "web",
      "value": "http://link.springer.com/openurl/fulltext?id=doi:10.1007/978-3-031-92076-9_16"
    },
    {
      "format": "pdf",
      "platform": "web",
      "value": "http://link.springer.com/openurl/pdf?id=doi:10.1007/978-3-031-92076-9_16"
    },
    {
      "format": "",
      "platform": "",
      "value": "http://dx.doi.org/10.1007/978-3-031-92076-9_16"
    }
  ]
}
```

The frontend was trying to render the array directly with `String(citation.url)`, which converts objects to the string "[object Object]".

---

## Solution

### 1. Updated Citation Type Definition
**File**: `src/lib/api.ts`

```typescript
export interface Citation {
  id?: string;
  title?: string;
  authors?: string;
  source: string;
  url: string | Array<{ format: string; platform: string; value: string }>;
  summary?: string;
  published?: string;
  doi?: string;
}
```

### 2. Smart URL Handling Logic
**File**: `src/components/chat/ChatInterface.tsx`

```typescript
// Handle url which can be string or array of url objects
let urlToDisplay = '';
let urlHref = '';

if (citation.url) {
  if (typeof citation.url === 'string') {
    // Simple string URL (arXiv, PubMed)
    urlToDisplay = citation.url;
    urlHref = citation.url;
  } else if (Array.isArray(citation.url)) {
    // Array of URL objects (Nature) - prefer PDF > HTML > any
    const pdfUrl = citation.url.find(u => u.format === 'pdf');
    const htmlUrl = citation.url.find(u => u.format === 'html');
    const anyUrl = citation.url.find(u => u.value);
    
    const selectedUrl = pdfUrl || htmlUrl || anyUrl;
    if (selectedUrl) {
      urlToDisplay = selectedUrl.format 
        ? `View ${selectedUrl.format.toUpperCase()}` 
        : 'View Article';
      urlHref = selectedUrl.value;
    }
  }
}
```

### 3. Enhanced Citation Display
Added metadata display:
- Source name
- Published date
- Proper link text for array-based URLs

---

## Display Examples

### Before (Broken)
```
Title: Defining Breeding Goals...
Authors: Mrode, Raphael et al.
[object Object][object Object][object Object]
```

### After (Fixed)
```
Title: Defining Breeding Goals...
Authors: Mrode, Raphael et al.
Source: Nature • 2026-01-01
View PDF
```

---

## URL Selection Priority for Nature Citations

When multiple URL formats are available:
1. **PDF** - First choice (research papers)
2. **HTML** - Second choice (web version)
3. **Any** - Fallback (DOI or other)

This ensures users get the best reading experience.

---

## Files Modified

1. **src/lib/api.ts**
   - Updated `Citation` interface
   - Added `url` union type
   - Added `summary`, `published`, `doi` fields

2. **src/components/chat/ChatInterface.tsx**
   - Added smart URL handling logic
   - Added source and date display
   - Improved link text for array-based URLs

---

## Testing

### Test Cases
✅ arXiv citation → Direct URL link  
✅ PubMed citation → Direct URL link  
✅ Nature citation (array) → "View PDF" link  
✅ Multiple Nature URLs → Selects PDF first  
✅ Source and date display correctly  
✅ All links open in new tab  

---

## Backend Context

The backend aggregates citations from three sources:
- **arXiv**: Returns single string URL
- **PubMed**: Returns single string URL  
- **Nature**: Returns array of URL objects with different formats

The frontend now handles all three correctly!

---

## Note

This is **not a backend issue** - the backend is working as designed. Different citation APIs return URLs in different formats, and our frontend now gracefully handles both.
