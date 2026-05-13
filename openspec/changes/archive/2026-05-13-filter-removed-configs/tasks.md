## 1. Query Layer

- [x] 1.1 Add `RECENT_CONFIG_HOURS = 12` constant in `src/db/queries.ts`
- [x] 1.2 Update `getConfigsWithData` signature to accept `activeLabels: string[]` parameter
- [x] 1.3 Implement two-query logic: return active labels directly, plus DB labels from last 12h not already in active set, merged and sorted alphabetically

## 2. Router

- [x] 2.1 Rename `_config` to `config` in `createRouter` signature in `src/web/routes.ts`
- [x] 2.2 Extract `config.bench.endpoints.map(e => e.label)` as `activeLabels`
- [x] 2.3 Pass `activeLabels` to `getConfigsWithData` in the `/api/configs` handler

## 3. Tests

- [x] 3.1 Add tests for `getConfigsWithData` with active labels: active label with no DB data appears, active label with DB data appears
- [x] 3.2 Add tests for recently-removed configs: removed config with recent data (within 12h) appears, removed config with stale data (>12h) does not appear, removed config with no data does not appear
- [x] 3.3 Add test for alphabetical ordering with mixed active/removed configs
- [x] 3.4 Verify existing route tests still pass
