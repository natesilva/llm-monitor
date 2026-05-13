## 1. API & Types

- [x] 1.1 Add `errorMessage: string | null` to `MetricsDataPoint` interface in `src/shared/types.ts`
- [x] 1.2 Update `getMetricsForConfig` SQL query in `src/db/queries.ts` to SELECT `error_message` and map it to `errorMessage` in the returned `MetricsDataPoint` objects
- [x] 1.3 Update `getDataPointsForConfig` SQL query in `src/db/queries.ts` to SELECT `error_message` and map it to `errorMessage` in the returned `MetricsDataPoint` objects
- [x] 1.4 Update `getComparisonMetrics` SQL query in `src/db/queries.ts` to SELECT `error_message` and `http_status`, and add `errorMessage` and `httpStatus` fields to `ComparisonDataPoint` type
- [x] 1.5 Verify API responses include `errorMessage` by running the dev server and checking `/api/metrics` and `/api/metrics/data-points` endpoints

## 2. Tile Chart Error Tooltips & Legend

- [x] 2.1 Add Chart.js `tooltip.callbacks` configuration to `createTileChart` in `app.js` so hovering an error point shows the `errorMessage` (or `HTTP {status}` if message is null)
- [x] 2.2 Add the same tooltip callback to `updateTileChart` so it persists across data refreshes
- [x] 2.3 Add a custom legend item (red dot labeled "Error") to tile charts when any error data points exist, using Chart.js `legend.labels.generateLabels` or a plugin

## 3. Comparison Chart Error Markers

- [x] 3.1 In `renderComparison`, stop filtering out data points with `tt100tMs === null`; instead split each config's data into success points (line dataset) and error points (scatter dataset)
- [x] 3.2 Create a scatter dataset per config for error points with red cross markers (`pointStyle: 'cross'`, `pointRadius: 4`, `backgroundColor: '#ef4444'`) plotted at their timestamp on the x-axis
- [x] 3.3 Add a single "Errors" legend entry for the scatter markers so the comparison legend remains clean

## 4. Stats Panel & Overlay Table

- [x] 4.1 Add a fourth stat to the tile stats panel in `renderTiles` showing `successRate` as a percentage (e.g., "98.5%") with label "Success Rate"
- [x] 4.2 Update `updateTileChart` to also update the success rate stat value on refresh
- [x] 4.3 Add an "Error" column header to the data overlay table in `index.html`
- [x] 4.4 Update `openOverlay` in `app.js` to include the `errorMessage` value in each table row's "Error" column cell

## 5. Verification

- [x] 5.1 Manually verify tile chart tooltips show error messages on hover for error points
- [x] 5.2 Verify comparison chart shows red cross markers for error runs
- [x] 5.3 Verify tile stats panel shows success rate percentage
- [x] 5.4 Verify data overlay table shows error messages in the Error column
