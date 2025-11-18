# Latest Fixes - Navigation & Frame Error

## Issues Fixed

### 1. ✅ "Emilia AI" Not Highlighted
**Problem**: When viewing a conversation (`?conversation=xxx`), the "Emilia AI" navigation item wasn't highlighted

**Root Cause**: 
- The `isActive` check excluded any URL with a conversation parameter
- This meant "Emilia AI" was never active when viewing conversations

**Solution**:
- Updated logic: "Emilia AI" (`/`) is always active when `pathname === "/"`
- Other navigation items remain inactive when conversation parameter exists
- This correctly shows "Emilia AI" as the active section even when viewing conversations

```typescript
// Before
isActive={location.pathname === url && !hasConversation}

// After
const isActive = url === "/" 
  ? location.pathname === url  // Always active for "Emilia AI"
  : location.pathname === url && !hasConversation; // Other pages
```

---

### 2. ✅ Frame ID Error Fixed
**Problem**: Console error: "Invalid frameId for foreground frameId: 0"

**Root Cause**:
- Using `asChild` prop with unnecessary div wrapper in `SidebarMenuButton`
- This created an invalid component structure that confused React's reconciliation

**Solution**:
- Removed `asChild` prop
- Removed unnecessary `div` wrapper
- Render icon and text directly inside `SidebarMenuButton`
- Cleaner component structure, no frame ID errors

```typescript
// Before
<SidebarMenuButton asChild>
  <div className="...">
    <Icon />
    <span>Text</span>
  </div>
</SidebarMenuButton>

// After
<SidebarMenuButton>
  <Icon />
  <span>Text</span>
</SidebarMenuButton>
```

---

## File Modified
- `src/components/layout/AppSidebar.tsx`

## Testing
- [x] "Emilia AI" highlighted on home page
- [x] "Emilia AI" remains highlighted when viewing conversations
- [x] No frame ID errors in console
- [x] Navigation still works correctly
- [x] Clicking "Home" clears conversation and resets state

---

## Additional Context

### Why "Emilia AI" Should Always Be Highlighted
The chat interface is the main/default view of the application. When users are viewing conversations, they're still within the "Emilia AI" section of the app. This is similar to how:
- Gmail highlights "Inbox" even when viewing individual emails
- Slack highlights the channel even when viewing threads
- Twitter highlights "Home" even when viewing individual tweets

### Frame ID Error Context
The frame ID error was a React rendering issue, not related to browser extensions. It occurred because:
1. `asChild` tells Radix UI to merge props with the child element
2. But we wrapped content in an extra `div`
3. This created an invalid component hierarchy
4. React couldn't properly track the frame during reconciliation

Removing `asChild` and the wrapper fixed the issue.
