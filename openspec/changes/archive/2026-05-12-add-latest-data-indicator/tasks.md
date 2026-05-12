## 1. Backend: Latest Data Query

- [x] 1.1 Add `getLatestTimestamp(db)` function in `src/db/queries.ts` that queries `SELECT MAX(timestamp) FROM benchmark_runs` and returns `string | null`
- [x] 1.2 Add `GET /api/latest-data` route in `src/web/routes.ts` that calls `getLatestTimestamp` and returns `{ latestTimestamp: string | null }`

## 2. Frontend: Latest Data Display

- [x] 2.1 Add a `<p class="subtitle" id="latest-data">Loading...</p>` element next to `#last-refresh` in `src/web/static/index.html`
- [x] 2.2 In `src/web/static/app.js`, fetch `/api/latest-data` in the `refresh()` function and update `#latest-data` text content — show formatted time when non-null, "No data yet" when null
