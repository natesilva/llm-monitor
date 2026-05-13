## Context

The dashboard uses Chart.js 4 for all charting. Currently, errors are represented only as small red dots (3px radius) on per-config tile line charts with no tooltip, label, or legend. Error messages stored in the `benchmark_runs` table (`error_message` column) are never fetched by any API query, so they never reach the frontend. The `successRate` stat is computed and returned by the API but is not rendered in any stats panel. The comparison chart silently drops error data points by filtering out rows where `tt100tMs` is null. The data overlay table shows HTTP status but not error messages.

All chart logic lives in a single vanilla JS file (`src/web/static/app.js`). The API is served from `src/web/server.ts` and queries are in `src/db/queries.ts`. Types are shared via `src/shared/types.ts`.

## Goals / Non-Goals

**Goals:**
- Surface error information in chart tooltips so users can see what went wrong at a glance
- Display success rate in the stats panel for each config tile
- Include error markers in the comparison chart instead of silently dropping them
- Show error messages in the data overlay table
- Add `errorMessage` to `MetricsDataPoint` so it flows from DB through API to frontend

**Non-Goals:**
- Dedicated error detail page or error-only view
- Error filtering or error-only chart mode
- Alerting or notification on errors
- Changing the comparison chart's primary metric (TT100T)
- Adding new API endpoints

## Decisions

### 1. Include `errorMessage` in existing SQL queries rather than creating a new endpoint

Add `error_message` to the SELECT clauses in `getMetricsForConfig`, `getDataPointsForConfig`, and add it to `MetricsDataPoint`. This avoids a new endpoint and keeps the data flowing through existing channels.

**Alternative considered**: Separate `/api/errors` endpoint — rejected because it would require a new route, new query, and extra frontend fetch calls for data that naturally belongs alongside existing metrics.

### 2. Show errors in comparison chart as scatter overlay markers

For the comparison chart, add error data points as a separate scatter-type dataset per config with distinct markers (e.g., `pointStyle: 'cross'`, larger radius, red color) at their timestamps. This preserves the existing TT100T line chart while making errors visible on the timeline.

**Alternative considered**: Interpolating error points onto the TT100T axis at y=0 — rejected because it would distort the y-axis scale and make successful data harder to read.

### 3. Display success rate as a percentage in the tile stats panel

Add a fourth stat to the existing `.tile-stats` row showing `successRate` as a percentage (e.g., "98.5%"). This is the simplest way to surface a stat that is already computed and returned by the API.

**Alternative considered**: Color-coded badge/indicator — rejected as a first pass in favor of simplicity; can be enhanced later.

### 4. Add Chart.js tooltip callback for error points on tile charts

Use the `tooltip.callbacks` configuration to show the error message when hovering over a red dot. This leverages Chart.js's built-in tooltip system with no new UI components.

### 5. Add a custom legend item explaining red dots

Use Chart.js's `legend` plugin with a custom item to show a red dot legend entry labeled "Error" alongside the existing (hidden) legend on tile charts. This makes the red dot color self-explanatory.

## Risks / Trade-offs

- **API response size increase**: Adding `errorMessage` to `MetricsDataPoint` slightly increases payload size. Most rows have null `errorMessage`, and SQLite returns NULL efficiently → acceptable trade-off.
- **Comparison chart clutter with many errors**: If a config has many errors, scatter markers could overlap. → Mitigation: Use `pointRadius: 4` and semi-transparent red; the temporal nature of the chart spreads markers across the time axis.
- **Tooltip only works on hover**: Mobile users won't see error tooltips. → Acceptable for now; the data overlay table also shows error messages as a fallback.
