# Research: Persist Comparison Graph Selection

**Date**: 2026-05-09
**Feature**: Persist active configuration selection for the Comparison graph across page reloads

## Decision 1: Storage Mechanism

**Decision**: Use `localStorage` with a JSON-serialized array key named `"comparison-configs"`.

**Rationale**:
- Follows the existing pattern: theme persistence already uses `localStorage.setItem("theme", mode)` / `localStorage.getItem("theme")`
- `localStorage` is synchronous, available in all modern browsers, and persists across sessions
- The data is a simple list of strings (configuration labels) — JSON serialization is trivial
- No server-side changes needed (constitution principle V: Minimal & Composable)

**Alternatives considered**:
- `sessionStorage`: Cleared when the tab closes — doesn't persist across browser sessions, defeats the purpose
- URL query parameters (`?configs=a,b`): Shareable but fragile (labels with commas or special chars), adds complexity for encoding/decoding, and pollutes the URL
- Server-side user preferences: Violates constitution principle V (no shared state between processes for this purpose); also requires authentication which the dashboard explicitly doesn't have

## Decision 2: Storage Format

**Decision**: Store as a JSON array of configuration label strings under key `"comparison-configs"`.

**Example**: `["gpt-4o", "claude-3"]`

**Rationale**:
- Simple, human-readable, easy to debug in DevTools
- Directly maps to the `activeConfigs` Set contents
- JSON.parse/stringify handles edge cases (special characters in labels)

**Alternatives considered**:
- Comma-separated string: Ambiguous if a label contains a comma; requires custom split/join logic
- IndexedDB: Overkill for a simple string list; async API adds unnecessary complexity

## Decision 3: When to Save

**Decision**: Save immediately whenever a configuration toggle button is clicked (add or remove from `activeConfigs`).

**Rationale**:
- Matches the theme toggle pattern: `applyTheme()` calls `localStorage.setItem("theme", mode)` immediately
- No debounce needed — toggle clicks are low-frequency user actions
- Ensures persistence is always in sync with the UI state

## Decision 4: When to Load and Stale Data Handling

**Decision**: Load saved selection at the start of `renderToggles()`, before creating toggle buttons. Filter out any saved labels that no longer exist in `allConfigs`.

**Rationale**:
- `renderToggles()` is where `activeConfigs` is first populated — the natural place to restore from localStorage
- Filtering stale entries on load satisfies FR-004 (silently ignore non-existent configs)
- If the filtered result is empty, the existing fallback (`if (activeConfigs.size === 0)` in `renderToggles()`) selects all configs, satisfying FR-003
