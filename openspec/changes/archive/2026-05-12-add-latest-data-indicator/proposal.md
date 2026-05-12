## Why

The dashboard shows "Last updated" which reflects when the browser refreshed the page, not how fresh the underlying benchmark data is. A user seeing "Last updated: 2:30 PM" has no way to know if the latest benchmark run was 5 seconds ago or 5 hours ago. This makes it difficult to gauge data freshness at a glance.

## What Changes

- Add a "Latest data" timestamp display next to the existing "Last updated" indicator in the dashboard header
- Add a new API endpoint that returns the most recent `benchmark_runs.timestamp` across all configs
- Update the frontend `refresh()` loop to fetch and display the latest data timestamp

## Capabilities

### New Capabilities
- `latest-data-api`: API endpoint that returns the timestamp of the most recent benchmark run in the database
- `latest-data-display`: Frontend display of the latest benchmark data timestamp alongside the existing "Last updated" indicator

### Modified Capabilities

## Impact

- `src/web/routes.ts` — new API endpoint
- `src/db/queries.ts` — new query to get max timestamp
- `src/web/static/index.html` — new UI element in header
- `src/web/static/app.js` — fetch and display latest data timestamp on refresh
