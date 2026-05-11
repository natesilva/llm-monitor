# Research: Clean Up Web UI Stats Display

**Branch**: `014-cleanup-web-stats` | **Date**: 2026-05-11

## Research Tasks

### 1. Current Stat Card Display

**Finding**: The per-configuration stat cards in `src/web/static/app.js` (lines 210-214) already display exactly three stats:
- Avg TPS (`metrics.stats.avgTps`)
- Avg TT100T (`metrics.stats.avgTt100tMs`, shown as "N/A" when null)
- TPS StdDev (`metrics.stats.tpsStdDev`)

The update path (lines 324-332) also correctly updates only these three values.

**Decision**: No changes needed to stat cards — they already match FR-001 and FR-004.

**Rationale**: The previous feature (013-add-tt100t-metric) already added the TT100T stat and the stat cards were updated to show exactly three stats at that time. The CSS grid layout (`grid-template-columns: repeat(3, 1fr)`) already accommodates three columns.

**Alternatives considered**: None needed — current implementation already meets the requirement.

---

### 2. Comparison Graph Metric

**Finding**: The comparison graph in `src/web/static/app.js` (lines 374-376) already plots `d.tt100tMs` on the Y-axis. The Y-axis title is set to `"TT100T (ms)"` at line 418. Null TT100T data points are already filtered out (line 375: `.filter((d) => d.tt100tMs !== null)`).

**Decision**: No changes needed to the comparison graph — it already matches FR-002 and FR-005.

**Rationale**: The previous feature (013-add-tt100t-metric) already switched the comparison chart from TPS to TT100T.

**Alternatives considered**: None needed — current implementation already meets the requirement.

---

### 3. "Lower is Better" Note

**Finding**: The comparison section in `src/web/static/index.html` (line 321) already contains `<p class="comparison-note">lower is better</p>`. The CSS for `.comparison-note` (lines 99-105) styles it as centered, italic, small text in `--fg-muted` color.

**Decision**: No changes needed — the note already matches FR-003.

**Rationale**: The "lower is better" annotation was included when the comparison chart was switched to TT100T in the previous feature.

**Alternatives considered**: None needed — current implementation already meets the requirement.

---

## Summary

All three requirements from the specification are already implemented in the current codebase:

| Requirement | Current State | Action Needed |
|-------------|--------------|---------------|
| FR-001: Three stats only (Avg TPS, Avg TT100T, TPS StdDev) | Already implemented (app.js:210-214) | None |
| FR-002: Comparison graph shows TT100T | Already implemented (app.js:374-376, 418) | None |
| FR-003: "lower is better" note | Already implemented (index.html:321) | None |
| FR-004: Null TT100T shows "N/A" | Already implemented (app.js:212, 329) | None |
| FR-005: Null TT100T excluded from graph | Already implemented (app.js:375) | None |

The previous feature (013-add-tt100t-metric) implemented all of these changes. This feature specification validates that the implementation is complete and correct.
