# Research: Web UI Quality-of-Life Improvements

## Decision 1: Theming approach

**Decision**: CSS custom properties (variables) on `<html>` element, toggled via a `data-theme` attribute.

**Rationale**: The existing dashboard uses inline hex colors throughout `index.html`'s `<style>` block. The simplest migration is to extract those values into CSS custom properties scoped to `[data-theme="dark"]` and `[data-theme="light"]`, then replace hardcoded colors with `var(--xxx)`. No build step, no CSS framework, no new dependencies.

**Alternatives considered**:
- `prefers-color-scheme` media queries only: Doesn't support manual override or persistence; can't offer three modes.
- CSS framework (Tailwind dark mode): Would require adding a build step and rewriting all styles. Violates "minimal changes" principle.
- `color-scheme` CSS property alone: Only affects form controls; doesn't retheme custom elements.

## Decision 2: Theme persistence and auto mode

**Decision**: Store the user's choice in `localStorage` under key `theme`. On load, read the stored value. If absent or `"auto"`, use `window.matchMedia("(prefers-color-scheme: dark)")` to determine effective theme. Listen for `matchMedia` changes when in auto mode.

**Rationale**: `localStorage` is the standard client-side persistence mechanism. `matchMedia` with `addEventListener("change", ...)` provides real-time system preference updates. This is the same pattern used by every major documentation site and web app.

**Alternatives considered**:
- Cookie-based persistence: Unnecessary server round-trips for a purely client-side concern.
- No persistence: Fails FR-004 (persist across page reloads).

## Decision 3: Theme toggle UI placement

**Decision**: Add a small segmented control (Light / Auto / Dark) in the top-right area of the page header, using the existing toggle button style pattern from the comparison section.

**Rationale**: Consistent with the existing `toggle-btn` pattern already in the codebase. Placement in the header is conventional and discoverable. A segmented control (3 mutually exclusive buttons) maps directly to the three modes.

**Alternatives considered**:
- Dropdown/select: Less immediate; requires extra click to see options.
- Icon-only toggle (sun/moon): Only toggles between two states; doesn't communicate "auto" mode.

## Decision 4: Data overlay implementation

**Decision**: A single `<dialog>` element rendered once in the HTML, populated dynamically via JavaScript when a tile button is clicked. The `<dialog>` element natively supports backdrop click-to-close and Escape-to-close.

**Rationale**: `<dialog>` is a native HTML element with built-in modal behavior, backdrop support, and Escape key handling — exactly matching FR-009. No new dependencies. Single DOM element reused across tiles.

**Alternatives considered**:
- Custom overlay div with manual backdrop/Escape handling: More code, reimplements what `<dialog>` provides natively.
- Third-party modal library: Adds a dependency; violates "minimal changes" principle.

## Decision 5: Data points API endpoint

**Decision**: Add `GET /api/metrics/data-points?config=<label>&hours=<n>` that returns the most recent raw data points for a configuration, ordered by timestamp descending, limited to a configurable count (default 50).

**Rationale**: The existing `/api/metrics` endpoint already returns `dataPoints` but includes computed stats. For the overlay table, we need the same raw rows but potentially more of them and ordered newest-first. A dedicated endpoint keeps the contract clean. The query reuses the existing `benchmark_runs` table and query pattern from `getMetricsForConfig`.

**Alternatives considered**:
- Reuse `/api/metrics`: Its data is ordered oldest-first and includes stats payload the overlay doesn't need. Would work but is semantically wrong.
- Client-side filtering from existing endpoint: The existing endpoint already returns all data points within the time range; could just reverse-sort client-side. However, this doesn't allow limiting row count or ordering differently without changing the existing endpoint's contract.

## Decision 6: Chart.js theme adaptation

**Decision**: On theme change, update Chart.js global defaults for grid/tick colors and call `chart.update()` on all active chart instances.

**Rationale**: Chart.js charts are already created with hardcoded `#555` tick colors and `#1f2230` grid colors. When theme changes, these need to update. The simplest approach is to set `Chart.defaults.color` and `Chart.defaults.borderColor` and then call `update()` on each chart instance. This matches the existing pattern of calling `chart.update("none")` in `app.js`.

**Alternatives considered**:
- Destroy and recreate charts on theme change: Works but causes visible flicker.
- CSS-based chart theming: Chart.js renders to canvas, not DOM, so CSS doesn't affect it.
