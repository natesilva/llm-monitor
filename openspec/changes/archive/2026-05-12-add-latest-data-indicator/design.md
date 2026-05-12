## Context

The web dashboard displays a "Last updated" timestamp in the header that reflects when the browser last polled for data (set via `new Date().toLocaleTimeString()` in `app.js:130`). This tells users when the page refreshed but not how old the underlying benchmark data is. The `benchmark_runs` table stores an ISO 8601 `timestamp` per run. There is no existing API endpoint or query to retrieve the most recent run timestamp.

## Goals / Non-Goals

**Goals:**
- Display the timestamp of the most recent benchmark run alongside "Last updated" in the dashboard header
- Add a lightweight API endpoint to retrieve the latest data timestamp
- Keep the solution minimal — no new dependencies or architectural changes

**Non-Goals:**
- Per-config freshness indicators (single global latest timestamp is sufficient)
- Configurable freshness thresholds or alerts
- Changing the existing "Last updated" behavior

## Decisions

1. **New API endpoint: `GET /api/latest-data`** — Returns `{ latestTimestamp: string | null }`. A dedicated endpoint is simpler and cheaper than embedding the max timestamp into the existing `/api/configs` response, and avoids changing the contract of existing endpoints.

2. **New query: `getLatestTimestamp(db)`** — Uses `SELECT MAX(timestamp) FROM benchmark_runs`. This leverages the existing `idx_runs_timestamp` index and returns a single row. Returns `null` when the table is empty.

3. **Frontend: add `#latest-data` element adjacent to `#last-refresh`** — Display as "Latest data: <time>" on the same line or below "Last updated". Fetched once per `refresh()` cycle alongside other API calls. Shows "No data yet" when the API returns `null`.

4. **Format the timestamp using `toLocaleTimeString()`** — Parse the ISO string from the API and format with the browser's locale, consistent with how "Last updated" is already formatted.

## Risks / Trade-offs

- **Empty database**: When no runs exist, `MAX(timestamp)` returns `null`. The UI shows "No data yet" → acceptable, since the dashboard already handles the empty state gracefully.
