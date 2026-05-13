## Why

The web UI shows a tile for every config label that has ever had benchmark data, with no awareness of which configs are currently defined in config.yaml. When a config is removed, its tile persists indefinitely (up to retentionDays), cluttering the dashboard with stale entries that are no longer being monitored.

## What Changes

- The `/api/configs` endpoint will filter config labels to show only: (1) configs currently defined in config.yaml, and (2) configs not in config.yaml that have benchmark data within the last 12 hours
- After the 12-hour window expires, removed configs naturally disappear from the API response and the frontend removes their tiles
- The 12-hour window is hardcoded — no configuration option needed

## Capabilities

### New Capabilities
- `config-filtering`: Filtering of displayed configs based on currently-defined endpoints plus a fixed 12-hour recency window for removed configs

### Modified Capabilities

## Impact

- `src/db/queries.ts`: `getConfigsWithData` needs awareness of active config labels and a time-based fallback for removed configs
- `src/web/routes.ts`: The router already receives `AppConfig` (currently unused, prefixed `_config`) — it must pass active labels to the query layer
- `src/web/static/app.js`: Frontend already handles tiles disappearing from `allConfigs` (renderTiles removes stale tiles, renderToggles filters saved selections) — no changes needed
