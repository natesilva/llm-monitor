# Tasks: Add TT100T Metric

**Input**: Design documents from `specs/013-add-tt100t-metric/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup

*No new project scaffolding required — all changes are within the existing source tree.*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type definitions, schema migration, and DB write path — must complete before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 Update `BenchmarkRun` interface in `src/shared/types.ts` to add `timeToFirst100TokensMs: number | null`
- [X] T002 Update `MetricsDataPoint` interface in `src/shared/types.ts` to add `tt100tMs: number | null`
- [X] T003 Update `ConfigStats` interface in `src/shared/types.ts` to add `avgTt100tMs: number | null`

  *(T001–T003 all edit `src/shared/types.ts` — ship as a single commit, not three separate PRs)*
- [X] T004 Create migration `src/db/migrations/0003_add_tt100t.sql`: `ALTER TABLE benchmark_runs ADD COLUMN tt100t_ms INTEGER`
- [X] T005 Update `insertRun` in `src/db/queries.ts` to accept and write the `tt100t_ms` value from `BenchmarkRun.timeToFirst100TokensMs`; update the `INSERT` statement and parameter array accordingly

**Checkpoint**: Types compile, migration applies, `insertRun` accepts `tt100t_ms`. All subsequent phases can begin.

---

## Phase 3: User Story 1 — TT100T Measurement in Runner (Priority: P1) 🎯 MVP

**Goal**: Capture TT100T during streaming runs by tracking cumulative estimated tokens and recording the timestamp when the 100-token threshold is reached.

**Independent Test**: Run a streaming benchmark that generates >100 tokens. Verify: (a) `tt100t_ms` is non-null in the DB row, (b) `tt100t_ms >= ttft_ms`, (c) `tt100t_ms <= latency_ms`. Run a benchmark that generates <100 tokens and verify `tt100t_ms` is null.

**Prerequisites**: Phase 2 complete.

- [X] T006 [US1] Add `cumulativeTokens` counter and `tt100tTimestamp` variable in `runStreamingEndpoint` in `src/bench/runner.ts`. Initialize `cumulativeTokens = 0` and `tt100tTimestamp: number | null = null` alongside the existing `firstChunkTime`, `lastChunkTime`, etc.
- [X] T007 [US1] In the SSE content handler (where `hasContent || hasReasoning`), increment `cumulativeTokens` by `Math.round((content or reasoning text length) / 4)` per chunk, using the same text-length/4 heuristic as the post-stream fallback. When `cumulativeTokens >= 100` and `tt100tTimestamp === null`, set `tt100tTimestamp = now` in `src/bench/runner.ts`
- [X] T008 [US1] After the stream ends, compute `timeToFirst100TokensMs = tt100tTimestamp !== null ? Math.round(tt100tTimestamp - start) : null` in `src/bench/runner.ts`
- [X] T009 [US1] Pass `timeToFirst100TokensMs` to the `insertRun` call in `src/bench/runner.ts`; for non-streaming runs, pass `timeToFirst100TokensMs: null`
- [X] T010 [US1] Update console log line for streaming runs in `src/bench/runner.ts`: append `TT100T` when available, e.g. `OK — 42.5 TPS, 185ms TTFT, 2610ms TT100T, 1200ms total, 120 tokens`; omit TT100T when null
- [X] T011 [US1] Update `computeStats` in `src/db/queries.ts` to compute `avgTt100tMs` from rows where `tt100t_ms IS NOT NULL`; return `null` when no non-null rows exist in the window. Also update the `computeStats` input type (rows array) to include `tt100tMs: number | null` alongside existing `ttftMs`.
- [X] T012 [US1] Update `getMetricsForConfig` query in `src/db/queries.ts` to `SELECT tt100t_ms` alongside existing columns; map to `tt100tMs` in the returned `MetricsDataPoint` array and include `avgTt100tMs` in the returned `ConfigStats`
- [X] T013 [US1] Update `getDataPointsForConfig` query in `src/db/queries.ts` to `SELECT tt100t_ms` and include `tt100tMs` in the returned `MetricsDataPoint` array

**Checkpoint**: Streaming run recorded with `tt100t_ms` in DB. API response includes `tt100tMs` and `avgTt100tMs`. Non-streaming runs and sub-100-token runs store null.

---

## Phase 4: User Story 2 — TT100T Dashboard Display (Priority: P2)

**Goal**: Expose TT100T as visible, labeled metrics in the dashboard stat tiles and data table. Users can compare provider responsiveness at a glance.

**Independent Test**: Open the dashboard for a configuration that has streaming runs with >100 tokens. Confirm: (a) the "Avg TT100T" stat tile displays a millisecond value, (b) the data overlay table has a "TT100T" column with values for runs that reached 100 tokens and "N/A" for those that didn't.

**Prerequisites**: Phase 3 complete (API provides `tt100tMs`, `avgTt100tMs`).

- [X] T014 [US2] Add "Avg TT100T" stat tile to the per-configuration stats section in `src/web/static/app.js`, displaying `ms` value when non-null and "N/A" when null; position tile alongside existing TTFT tiles
- [X] T015 [US2] Update `updateTileChart` in `src/web/static/app.js` to update the TT100T stat value on refresh (add to the `values` array update block)
- [X] T016 [US2] Add a "TT100T" column header to the data table in `src/web/static/index.html` (after the TTFT column)
- [X] T017 [US2] Populate the TT100T data table column in `src/web/static/app.js` for each row in `openOverlay`: show the `tt100tMs` value in ms when non-null, show "N/A" when null

**Checkpoint**: Dashboard shows Avg TT100T stat tile and per-run TT100T column. Sub-100-token and non-streaming rows show N/A cleanly.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Tests required by the project constitution, plus consistency verification.

- [X] T018 [P] Update `seedData` in `src/web/routes.test.ts` to include `timeToFirst100TokensMs` in `insertRun` calls (e.g., `i % 2 === 0 ? 200 + i * 20 : null` for alternating null/non-null pattern)
- [X] T019 [P] Add route test assertions in `src/web/routes.test.ts` for `tt100tMs` field presence in data points and `avgTt100tMs` in stats
- [X] T020 [P] Add runner integration test in `src/bench/runner.test.ts` for TT100T: streaming run with >100 tokens → non-null `tt100t_ms` that is `>= ttft_ms` and `<= latency_ms`
- [X] T021 [P] Add runner integration test in `src/bench/runner.test.ts` for sub-100-token streaming run → null `tt100t_ms`
- [X] T022 [P] Add runner integration test in `src/bench/runner.test.ts` for non-streaming run → null `tt100t_ms`
- [X] T023 Run `bun run tsc --noEmit` (or equivalent) to confirm no TypeScript errors across all modified files
- [X] T024 [P] Write unit tests for `computeStats` `avgTt100tMs` in `src/db/queries.test.ts`: test with mixed null/non-null values, all-null window (returns null), all-non-null window, and empty row set
- [X] T025 [P] Add test in `src/web/routes.test.ts` for legacy row queryability: insert a row without `tt100t_ms` value (simulating pre-migration data), verify the API returns it with `tt100tMs: null` without error
- [ ] T026 Manually verify the dashboard renders without JavaScript console errors when a time window contains a mix of streaming runs (with TT100T), non-streaming runs (null TT100T), sub-100-token runs (null TT100T), and pre-migration legacy rows (null TT100T)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately. Blocks all user story phases.
- **US1 (Phase 3)**: Depends on Phase 2 complete.
- **US2 (Phase 4)**: Depends on Phase 3 complete (needs API to expose TT100T fields).
- **Polish (Phase 5)**: Depends on Phase 3 complete for meaningful test targets; T018/T019 can start after Phase 2.

### Within Each Phase

- T001–T003 (type changes) are a single-commit batch — all edit `src/shared/types.ts` sequentially
- T004–T005 are sequential: migration file → insert function
- T006–T010 are sequential within the runner: each builds on the cumulative token tracking
- T011–T013 (query updates) are parallel with each other but sequential after T009
- T014–T015 are sequential (both in app.js; T014 creates the tile, T015 adds update logic)
- T016–T017 are parallel (different files)
- T018–T022 (tests) are parallel with each other
- T024–T025 are parallel with each other and with T018–T022

---

## Parallel Execution Examples

### Phase 2 (Foundational)
```
Sequential batch: T001 → T002 → T003  (all in src/shared/types.ts — one commit)
Then sequential: T004 → T005
```

### Phase 3 (US1 — Runner + Queries)
```
Sequential (runner): T006 → T007 → T008 → T009 → T010
Then parallel: T011, T012, T013  (separate query functions)
```

### Phase 4 (US2 — Dashboard)
```
Parallel: T014 + T015 (app.js, sequential within file), T016 (index.html), T017 (app.js)
Better: T16 first (HTML column header), then T014 + T015 + T017 together (app.js)
```

### Phase 5 (Polish)
```
Parallel: T018, T019, T020, T021, T022, T024, T025  (independent test files/functions)
Then: T023 (typecheck)
Then: T026 (manual dashboard verification)
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Phase 2: Foundational
2. Complete Phase 3: US1 (runner + DB + API)
3. **STOP and VALIDATE**: Run benchmarks, query DB directly for `tt100t_ms`, call `/api/metrics` and confirm `tt100tMs` in response
4. Proceed to US2 (dashboard display)

### Incremental Delivery

1. Phase 2 → all types and migration ready
2. Phase 3 → TT100T captured in DB and available via API (backend MVP)
3. Phase 4 → TT100T visible in dashboard (full delivery)
4. Phase 5 → tests and verification complete

---

## Notes

- `tt100t_ms` is nullable: null means "not measured" — could be legacy row, non-streaming run, sub-100-token run, or failure before 100 tokens
- The token counting heuristic (`textLength / 4`) is consistent with the existing post-stream fallback in the runner
- TT100T is a chunk-boundary approximation — the actual 100th token may have arrived within the chunk
- The comparison chart (`/api/metrics/compare`) is unchanged — TT100T is not added to it (same rationale as TTFT)
- `avgTt100tMs` uses arithmetic mean, not percentiles — simpler and sufficient for this composite metric
