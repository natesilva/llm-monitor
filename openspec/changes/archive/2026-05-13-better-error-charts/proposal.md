## Why

Errors are nearly invisible in the dashboard. The only indication is a small red dot (3px) on tile charts with no tooltip, label, or legend. Error messages stored in the database never reach the frontend. The `successRate` stat is computed by the API but never displayed. The comparison chart silently drops error runs entirely. Users cannot understand what went wrong, how often, or which configurations are failing.

## What Changes

- Add `errorMessage` to the `MetricsDataPoint` API response (include in SQL queries and TypeScript type)
- Display `successRate` in the per-config stats panel
- Add error tooltips to red dots on tile charts showing the error message
- Add a legend entry explaining red dots represent errors
- Show error data points in the comparison chart instead of silently dropping them (e.g., as a distinct series or markers on the time axis)
- Include `errorMessage` in the data overlay table
- Add an error summary indicator to each config tile (e.g., error count badge or rate)

## Capabilities

### New Capabilities
- `error-chart-visibility`: Error information is surfaced in charts via tooltips, legends, and error markers so users can see what failed and why
- `error-stats-display`: Success rate and error counts are shown in the stats panel and tile summaries

### Modified Capabilities
- `latest-data-display`: The MetricsDataPoint type and API response now include `errorMessage`; the overlay table shows error messages

## Impact

- **API**: `MetricsDataPoint` type gains `errorMessage` field; SQL queries in `queries.ts` must SELECT `error_message`
- **Frontend**: `app.js` tile chart rendering, comparison chart, stats panel, and overlay table all change
- **Types**: `shared/types.ts` - `MetricsDataPoint` interface updated
- **No breaking changes**: New field is optional; existing endpoints remain backward-compatible
