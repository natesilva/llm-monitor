# Quickstart: Web UI Quality-of-Life Improvements

## What's Changing

1. **Display mode toggle**: Light / Auto / Dark segmented control in the page header
2. **Data point overlay**: Clickable button on each tile that opens a dialog showing a table of recent data points
3. **New API endpoint**: `GET /api/metrics/data-points?config=<label>&hours=<n>&limit=<n>`

## Files Modified

| File                          | Change                                            |
|-------------------------------|---------------------------------------------------|
| `src/web/static/index.html`   | Add CSS custom properties for theming, theme toggle UI, `<dialog>` overlay |
| `src/web/static/app.js`      | Add theme logic, overlay logic, data point fetching |
| `src/web/routes.ts`           | Add `/api/metrics/data-points` route               |
| `src/db/queries.ts`           | Add `getDataPointsForConfig()` query function       |
| `src/shared/types.ts`         | Add `DataPointsResponse` type                       |
| `src/web/routes.test.ts`      | Add test for new endpoint                          |

## How to Verify

1. `bun run lint && bun run typecheck && bun run test`
2. `bun run web:dev` and open in browser
3. Click Light/Auto/Dark toggle — verify theme changes, persists on reload
4. Click data button on a tile — verify overlay shows data table, close via X/backdrop/Escape
