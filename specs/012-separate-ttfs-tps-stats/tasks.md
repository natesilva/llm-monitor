# Tasks: Separate TTFT and TPS Stats

**Input**: Design documents from `specs/012-separate-ttfs-tps-stats/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup

*No new project scaffolding required — all changes are within the existing source tree.*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type definitions, schema migration, and DB write path — must complete before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 Update `EndpointConfig` interface in `src/shared/types.ts` to add optional field `streaming?: boolean` (defaults to `true` at call sites)
- [X] T002 Update `BenchmarkRun` interface in `src/shared/types.ts` to add `timeToFirstTokenMs: number | null`
- [X] T003 Update `MetricsDataPoint` interface in `src/shared/types.ts` to add `ttftMs: number | null`
- [X] T004 Update `ConfigStats` interface in `src/shared/types.ts` to add `p50TtftMs: number | null` and `p95TtftMs: number | null`

  *(T001–T004 all edit `src/shared/types.ts` — ship as a single commit, not four separate PRs)*
- [X] T005 Create idempotent migration `src/db/migrations/0002_add_ttft.sql`: check column existence via `PRAGMA table_info(benchmark_runs)` before running `ALTER TABLE benchmark_runs ADD COLUMN ttft_ms REAL`
- [X] T006 Update `src/db/schema.ts` to apply migration `0002_add_ttft.sql` at startup (following the same pattern used for `0001_initial.sql`)
- [X] T007 Update `insertRun` in `src/db/queries.ts` to accept and write the `ttft_ms` value from `BenchmarkRun.timeToFirstTokenMs`; update the `INSERT` statement and parameter array accordingly

**Checkpoint**: Types compile, migration applies, `insertRun` accepts `ttft_ms`. All subsequent phases can begin.

---

## Phase 3: User Story 1 — Streaming TPS Measurement (Priority: P1) 🎯 MVP

**Goal**: Replace the non-streaming request with a streaming SSE request; compute TPS from the inter-token interval (first chunk to last chunk) rather than total wall-clock time.

**Independent Test**: Run one benchmark against a streaming-capable endpoint. Confirm: (a) the recorded `tps` value is higher than `completionTokens / (latencyMs / 1000)` when TTFT is non-trivial, (b) `ttft_ms` is non-null in the database row, (c) the run completes without error.

- [X] T008 [US1] Add `stream: true` and `stream_options: { include_usage: true }` to the request body in `src/bench/runner.ts`; switch `await res.text()` to streaming consumption using `for await (const chunk of response.body)` with a `TextDecoder`
- [X] T009 [US1] Implement SSE line parser in `src/bench/runner.ts`: split decoded text on `\n`, skip lines not starting with `data: `, skip `data: [DONE]`, parse JSON from each `data:` line
- [X] T010 [US1] Record `firstChunkTime` on the first SSE chunk whose `choices[0].delta.content` is a non-empty string; record `lastChunkTime` on each subsequent content chunk; accumulate content for token counting fallback in `src/bench/runner.ts`
- [X] T011 [US1] Extract token counts from the stream's final `usage` chunk (`stream_options` response) when present; fall back to counting non-empty content chunks if no `usage` chunk arrives, in `src/bench/runner.ts`
- [X] T012 [US1] Compute streaming TPS in `src/bench/runner.ts`: `completionTokens / ((lastChunkTime - firstChunkTime) / 1000)`; if only one content chunk was received (single-chunk response), set streaming TPS to `null` and use total-latency-derived TPS as the stored value instead
- [X] T013 [US1] Handle edge cases in `src/bench/runner.ts`: zero completion tokens → store `tps = 0` (not null; zero tokens = zero throughput; column must remain non-null); `timeToFirstTokenMs` null if no chunk received before error; interrupted stream after first chunk → store `tps = 0`, `timeToFirstTokenMs` = measured value
- [X] T014 [US1] Update console log line in `src/bench/runner.ts` for successful streaming runs to show both TPS and TTFT: e.g. `OK — 42.5 TPS, 185ms TTFT, 1200ms total, 120 tokens`
- [X] T015 [US1] Update `computeStats` in `src/db/queries.ts` to compute `p50TtftMs` and `p95TtftMs` from rows where `ttft_ms IS NOT NULL`; return `null` for both when no non-null rows exist in the window
- [X] T016 [US1] Update `getMetricsForConfig` query in `src/db/queries.ts` to `SELECT ttft_ms` alongside existing columns; map to `ttftMs` in the returned `MetricsDataPoint` array and include `p50TtftMs`/`p95TtftMs` in the returned `ConfigStats`
- [X] T017 [US1] Update `getDataPointsForConfig` query in `src/db/queries.ts` to `SELECT ttft_ms` and include `ttftMs` in the returned `MetricsDataPoint` array
- [X] T018 [US1] Update `GET /api/metrics` handler in `src/web/routes.ts` to pass `ttftMs` through in each data point and `p50TtftMs`/`p95TtftMs` through in the stats object (no change needed — routes pass query results directly)
- [X] T019 [US1] Update `GET /api/metrics/data-points` handler in `src/web/routes.ts` to include `ttftMs` in each data point (no change needed — routes pass query results directly)

**Checkpoint**: Streaming run recorded with `ttft_ms` in DB. API response includes `ttftMs` and TTFT stats. TPS reflects inter-token rate.

---

## Phase 4: User Story 2 — TTFT Dashboard Display (Priority: P1)

**Goal**: Expose TTFT as visible, labeled metrics in the dashboard stat tiles and data table. Users can identify responsiveness problems separately from throughput problems.

**Independent Test**: Open the dashboard for a configuration that has streaming runs. Confirm two new stat tiles display "P50 TTFT" and "P95 TTFT" with millisecond values. Confirm the data table has a "TTFT" column with values in ms for streaming runs and "N/A" for non-streaming or legacy rows.

**Prerequisites**: Phase 3 complete (API provides `ttftMs`, `p50TtftMs`, `p95TtftMs`).

- [X] T020 [US2] Add "P50 TTFT" and "P95 TTFT" stat tiles to the per-configuration stats section in `src/web/static/app.js`, displaying `ms` values when non-null and "N/A" when null; position tiles alongside existing P50/P95 Latency tiles
- [X] T021 [US2] Add a "TTFT" column header to the data table in `src/web/static/index.html` and `src/web/static/app.js`
- [X] T022 [US2] Populate the TTFT data table column in `src/web/static/app.js` for each row: show the `ttftMs` value in ms when non-null, show "N/A" when null

**Checkpoint**: Dashboard shows TTFT P50/P95 stat tiles and per-run TTFT column. Non-streaming/legacy rows show N/A cleanly.

---

## Phase 5: User Story 3 — Non-Streaming Fallback (Priority: P2)

**Goal**: Allow operators to configure `streaming: false` per endpoint, preserving the existing non-streaming measurement behavior for endpoints that do not support SSE. Runs are recorded with `timeToFirstTokenMs = null` and display "N/A" in the dashboard.

**Independent Test**: Set `streaming: false` on one endpoint config. Run a benchmark. Confirm: the run completes without error, `ttft_ms` is null in the DB row, the dashboard shows "N/A" in the TTFT column for that run, and TPS is the total-latency-derived value (same as before this feature).

**Prerequisites**: Phase 2 complete; Phase 3 and 4 do not need to be complete (US3 is independent once foundational work is done).

- [X] T023 [US3] Add `streaming: false` as a commented example field to one endpoint entry in `config.example.ts` so operators know the option exists; no code change is required — the field already flows from `EndpointConfig` through `ResolvedEndpoint` to the runner once T001 is complete
- [X] T024 [US3] Add a branch in `src/bench/runner.ts`: when `endpoint.streaming === false`, execute the existing non-streaming fetch path and set `timeToFirstTokenMs = null`; skip the SSE stream loop entirely
- [X] T025 [US3] Update console log line in `src/bench/runner.ts` for non-streaming runs to indicate the mode: e.g. `OK — 38.2 TPS (non-streaming), 1150ms, 44 tokens`

**Checkpoint**: Non-streaming endpoint runs complete cleanly. TPS is total-latency-derived. TTFT is null/N/A throughout.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Tests required by the project constitution, plus consistency verification.

- [X] T026 [P] Write unit tests for the updated `computeStats` function in a new file `src/db/queries.test.ts`: test P50/P95 TTFT with mixed null/non-null values, all-null window, all-non-null window, and empty row set
- [X] T027 [P] Write unit tests for streaming TPS edge cases in `src/bench/runner.test.ts` (new file): single-chunk response (TPS = total-latency-derived), zero-completion-tokens (TPS = 0), TTFT of 0ms, interrupted stream after first chunk; include a consistency assertion that `ttft_ms + (completionTokens / tps * 1000)` is within ±50ms or ±5% of `latency_ms` for a normal multi-token run (SC-002)
- [X] T028 Verify that `src/web/routes.test.ts` still passes after API response shape changes; add assertions for `ttftMs` fields in existing route tests
- [X] T029 Run `bun run tsc --noEmit` (or equivalent lint command) to confirm no TypeScript errors across all modified files (pre-existing errors from user-created files not in repo are unchanged)
- [ ] T030 Manually verify the dashboard renders without JavaScript console errors when a time window contains a mix of streaming runs (with TTFT), non-streaming runs (null TTFT), and pre-migration legacy rows (null TTFT); also confirm that `latency_ms` values for both streaming and non-streaming runs remain unchanged from pre-feature values (FR-003)
- [X] T031 Write end-to-end integration tests in `src/bench/runner.test.ts` using mocked fetch (Bun.serve unavailable in CI sandbox): assert non-null `ttft_ms` for streaming runs, `tps` correct for various edge cases, correct token counts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately. Blocks all user story phases.
- **US1 (Phase 3)**: Depends on Phase 2 complete.
- **US2 (Phase 4)**: Depends on Phase 3 complete (needs API to expose TTFT fields).
- **US3 (Phase 5)**: Depends on Phase 2 complete only — can run in parallel with Phase 3.
- **Polish (Phase 6)**: Depends on all user story phases complete.

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — core streaming + DB + API backend
- **US2 (P1)**: After US1 — frontend display only (needs API shape from US1)
- **US3 (P2)**: After Phase 2, independent of US1/US2

### Within Each Phase

- T001–T004 (type changes) are a single-commit batch — all edit `src/shared/types.ts` sequentially; do not attempt parallel commits to the same file
- T005–T007 are sequential: migration file → schema runner → insert function
- T008–T013 are sequential within the runner: each builds on the SSE loop from T008
- T016–T017 (query updates) are parallel
- T018–T019 (route updates) are parallel
- T026–T027 (new test files) are parallel

---

## Parallel Execution Examples

### Phase 2 (Foundational)
```
Sequential batch: T001 → T002 → T003 → T004  (all in src/shared/types.ts — one commit)
Then sequential: T005 → T006 → T007
```

### Phase 3 (US1 — Runner)
```
Sequential (each builds on previous): T008 → T009 → T010 → T011 → T012 → T013 → T014
Parallel after T015 is complete: T016, T017  (separate query functions)
Parallel after T016/T017: T018, T019  (separate route handlers)
```

### Phase 5 + Phase 3 (can run in parallel across stories)
```
After Phase 2 complete:
  Stream A: T008 → ... → T019  (US1)
  Stream B: T023 → T024 → T025 (US3)
Then: T020 → T021 → T022  (US2, needs US1 done)
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Phase 2: Foundational
2. Complete Phase 3: US1 (streaming runner + API)
3. **STOP and VALIDATE**: Run benchmarks, query DB directly for `ttft_ms`, call `/api/metrics` and confirm `ttftMs` in response
4. Proceed to US2 (dashboard display) and US3 (fallback config)

### Incremental Delivery

1. Phase 2 → all types and migration ready
2. Phase 3 → streaming TPS accurate in DB and API (backend MVP)
3. Phase 4 → TTFT visible in dashboard (full US1 + US2 delivered)
4. Phase 5 → non-streaming configs continue to work (US3 safety net)
5. Phase 6 → tests and verification complete

---

## Notes

- `tps` column is never null: single-chunk and non-streaming runs fall back to total-latency-derived TPS to avoid chart gaps
- `ttft_ms` null means "not measured" — could be legacy row, non-streaming run, or failure before first chunk; treat identically in UI (all show "N/A")
- The comparison chart (`/api/metrics/compare`) is unchanged — TTFT is not added to it per spec Assumptions
- Migration must be idempotent: wrap `ALTER TABLE` in a column-existence check via `PRAGMA table_info`
