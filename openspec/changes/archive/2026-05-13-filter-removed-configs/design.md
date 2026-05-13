## Context

Currently `getConfigsWithData(db)` in `src/db/queries.ts:33-40` runs a simple `SELECT DISTINCT config_label FROM benchmark_runs ORDER BY config_label` with no time filter and no awareness of what's defined in config.yaml. The router in `src/web/routes.ts` already receives `AppConfig` (as `_config`) but doesn't use it. The frontend already handles configs disappearing from the list — `renderTiles()` removes stale tiles, and `renderToggles()` filters saved selections against `allConfigs`.

## Goals / Non-Goals

**Goals:**
- Filter `/api/configs` to show only active configs (from config.yaml) plus recently-removed configs with data in the last 12 hours
- Enable active configs with zero data to appear in the UI (newly added configs show as empty tiles)
- No frontend changes required — existing cleanup logic handles removal naturally

**Non-Goals:**
- Visual de-emphasis or "inactive" badges for removed configs
- Configurable recency window (12h is hardcoded)
- Changes to other API endpoints (`/api/metrics`, `/api/metrics/compare`, etc.) — these already filter by config label and time range

## Decisions

### 1. Filter in the query layer, not the router

Change `getConfigsWithData` to accept an `activeLabels` parameter and perform the filtering in SQL, rather than returning all labels and filtering in the router.

**Rationale**: Keeping filtering in the query layer is consistent with the existing pattern (all other query functions take parameters and filter in SQL). It also keeps the router thin.

**Alternative considered**: Return all labels from the DB and filter in the router. Rejected because it pushes data-awareness logic into the HTTP layer.

### 2. SQL approach: UNION of active labels + recent DB labels

Use two queries combined in application code:
1. Return all `activeLabels` directly (they always appear, even with no data)
2. Query `SELECT DISTINCT config_label FROM benchmark_runs WHERE timestamp >= ?` for the 12h window, then subtract any labels already in `activeLabels`

**Rationale**: A single SQL UNION is not straightforward because active labels may not exist in benchmark_runs at all. Two simple queries composed in code is clearer and handles the "active but no data" case naturally.

**Alternative considered**: Single SQL query with `UNION SELECT ?` for each active label. Rejected — generating N placeholder binds for dynamic active labels is awkward and the two-query approach is simpler.

### 3. Pass active labels from router to query

The router extracts `config.bench.endpoints.map(e => e.label)` and passes it to the updated `getConfigsWithData`.

**Rationale**: `AppConfig` is already available in `createRouter` — just rename `_config` to `config` and extract labels. No new data flow needed.

### 4. Hardcoded 12-hour constant

Define `RECENT_CONFIG_HOURS = 12` as a constant in `queries.ts`.

**Rationale**: Keeps the constant close to where it's used. If it ever needs to change, it's one line. No config.yaml option per the proposal.

## Risks / Trade-offs

- **[Active configs with no data appear as empty tiles]** → Mitigation: The frontend already handles this case — `renderTiles()` shows "No data yet" for configs with zero data points. This is actually a feature: newly added configs are immediately visible.
- **[12h window may feel too short or too long]** → Mitigation: It's a single constant, easy to adjust. The trade-off of hardcoded vs. configurable was explicitly chosen — 12h is a reasonable default.
- **[Config label rename treated as remove + add]** → Mitigation: If a label is renamed in config.yaml, the old label will appear for 12h then disappear, and the new label appears immediately with an empty tile. This matches user expectations.
