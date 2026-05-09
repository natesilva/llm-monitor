# Tasks: LLM Performance Dashboard

**Input**: Design documents from `specs/001-performance-dashboard/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested. Test tasks are omitted. Each phase includes an independent test checkpoint for manual validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project root**: `src/`, `tests/` at repository root
- Paths based on plan.md structure (single-package monorepo)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Bun project with `package.json` (type: module, ESM), `tsconfig.json` (strict, esnext module), and `.gitignore` (data/, node_modules/, .env) at project root
- [ ] T002 [P] Create project directory structure per plan.md: `src/bench/`, `src/web/`, `src/db/`, `src/db/migrations/`, `src/shared/`, `tests/bench/`, `tests/web/`, `tests/db/`, `tests/integration/`, `data/`
- [ ] T003 [P] Install Chart.js as the sole external dependency via `bun add chart.js`, and TypeScript as dev dependency via `bun add -d typescript`
- [ ] T004 [P] Create `config.example.ts` at project root exporting a sample `AppConfig` with 2 example endpoints, web port 3000, db path `./data/llm-monitor.db`, 30-day retention, and cron schedule `"0 * * * *"`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Define shared TypeScript types in `src/shared/types.ts`: `AppConfig`, `BenchConfig`, `EndpointConfig`, `WebConfig`, `DbConfig`, `BenchmarkRun`, `MetricsDataPoint`, `ConfigStats`, `ComparisonSeries` — matching the interfaces in `contracts/api.md`
- [ ] T006 Implement shared config loader in `src/shared/config.ts`: import and validate `config.ts` from project root, resolve API keys from `process.env[apiKeyEnvVar]`, apply defaults (temperature: 0, maxTokens: 100, timeoutMs: 30000, port: 3000, host: "127.0.0.1", retentionDays: 30, dbPath: "./data/llm-monitor.db"), throw on missing required fields
- [ ] T007 Create database migration `src/db/migrations/0001_initial.sql`: `CREATE TABLE IF NOT EXISTS benchmark_runs` with columns per data-model.md (id INTEGER PK AUTOINCREMENT, config_label TEXT NOT NULL, model TEXT NOT NULL, timestamp TEXT NOT NULL, prompt_tokens INTEGER NOT NULL, comp_tokens INTEGER NOT NULL, total_tokens INTEGER NOT NULL, latency_ms INTEGER NOT NULL, tps REAL NOT NULL, http_status INTEGER NOT NULL, error_message TEXT), plus indexes `idx_runs_config_timestamp` and `idx_runs_timestamp`; include `PRAGMA journal_mode = WAL;`
- [ ] T008 Implement database schema and migration runner in `src/db/schema.ts`: open `Database` via Bun.sqlite(), run all `.sql` files from `src/db/migrations/` in order, enable WAL mode, export `initDb(dbPath: string)` function
- [ ] T009 Implement database query functions in `src/db/queries.ts`: `insertRun(db, run)`, `getMetricsForConfig(db, configLabel, hours)` returning `{dataPoints, stats}`, `getComparisonMetrics(db, hours, configs?)` returning `{series}`, `getConfigsWithData(db)` returning string[], `pruneOldRuns(db, retentionDays)` — all using parameterized queries per data-model.md query patterns; stats computation includes avgTps, p50LatencyMs, p95LatencyMs, successRate, tpsStdDev

**Checkpoint**: Foundation ready — shared types, config loader, database layer all functional. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Per-Configuration Performance Tiles (Priority: P1) 🎯 MVP

**Goal**: Dashboard displays a tile for each configuration with a 48h TPS line graph and summary statistics (avg TPS, p50/p95 latency, success rate, TPS std dev)

**Independent Test**: Seed the database with 3-5 configurations of sample benchmark data over 48 hours, run `bun run web`, open http://127.0.0.1:3000 — each tile should render a correct TPS graph and statistics

### Implementation for User Story 1

- [ ] T010 [P] [US1] Implement HTTP server entry point in `src/web/index.ts`: load config via `src/shared/config.ts`, init DB via `src/db/schema.ts`, start `Bun.serve()` on configured host/port with routes from `src/web/routes.ts`, log startup message, handle SIGTERM/SIGINT for graceful shutdown
- [ ] T011 [P] [US1] Implement API route handlers in `src/web/routes.ts`: `GET /api/configs` → call `getConfigsWithData`, `GET /api/metrics?config=&hours=` → call `getMetricsForConfig`, `GET /api/metrics/compare?hours=&configs=` → call `getComparisonMetrics`, `GET /` → serve dashboard HTML, `GET /assets/*` → serve static files from `src/web/static/`
- [ ] T012 [US1] Build dashboard HTML page in `src/web/static/index.html`: responsive tile grid layout, each tile contains a `<canvas>` for the Chart.js line graph and a stats summary area (avg TPS, p50 latency, p95 latency, success rate, std dev), a placeholder section for the comparison graph (US2), consistent styling with readable fonts and card shadows, empty state message "No data yet" for zero-data configurations
- [ ] T013 [US1] Implement client-side tile rendering in `src/web/static/app.js`: fetch `/api/configs` to get config list, for each config fetch `/api/metrics?config=<label>&hours=48`, render a Chart.js line graph on each tile's canvas (x-axis: time, y-axis: TPS, point colors: green for success, red for failure), populate stats summary below each graph, auto-refresh data every 60 seconds

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Dashboard shows per-configuration tiles with 48h TPS graphs and statistics.

---

## Phase 4: User Story 2 - Cross-Configuration Comparison Graph (Priority: P2)

**Goal**: A single comparison graph shows TPS over 24 hours for all configurations, with selectable/deselectable configuration lines

**Independent Test**: With seeded multi-config data, open the dashboard — the comparison graph should show all config lines, clicking a config toggle should add/remove its line, deselecting all should show empty state

### Implementation for User Story 2

- [ ] T014 [US2] Add comparison graph section to `src/web/static/index.html`: a dedicated `<canvas>` element above or below the tile grid, a row of toggle buttons/checkboxes (one per configuration) for selecting which lines appear, all configurations selected by default
- [ ] T015 [US2] Implement comparison graph rendering in `src/web/static/app.js`: fetch `/api/metrics/compare?hours=24`, render a multi-dataset Chart.js line graph (one dataset per config, each with a distinct color), bind toggle button click events to add/remove datasets from the chart, handle all-deselected empty state with "Select configurations to compare" message, update on auto-refresh cycle

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Dashboard shows tiles plus comparison graph with selection toggles.

---

## Phase 5: User Story 3 - Scheduled Multi-Provider Benchmark Runner (Priority: P3)

**Goal**: OS-level cron job invokes the benchmark runner against configured OpenAI-compatible endpoints on a schedule; runner records results to the database and exits

**Independent Test**: Configure 2 endpoints in config.ts, run `bun run bench:setup` to register the cron job, run `bun run bench` manually to verify results appear in the SQLite database, verify the cron job fires on schedule

### Implementation for User Story 3

- [ ] T016 [P] [US3] Implement bench entry point in `src/bench/index.ts`: load config via `src/shared/config.ts`, init DB via `src/db/schema.ts`, call `runAllEndpoints()`, then call `pruneOldRuns()`, then exit (one-shot — no scheduling loop, no SIGTERM handling needed)
- [ ] T017 [P] [US3] Implement config loader for bench process in `src/bench/config.ts`: export `loadEndpoints()` that reads config, validates each endpoint has a non-empty API key in env (loaded from `.env` by Bun automatically), returns the endpoint list
- [ ] T018 [US3] Implement endpoint runner in `src/bench/runner.ts`: export `runEndpoint(db, endpoint)` that sends `POST {baseUrl}/v1/chat/completions` with `fetch()`, measures wall-clock latency with `performance.now()`, parses the OpenAI response (usage.prompt_tokens, usage.completion_tokens, usage.total_tokens, model), computes TPS = completionTokens / (latencyMs / 1000), inserts result via `insertRun()`; on HTTP error (non-2xx or network failure), record httpStatus and errorMessage and continue
- [ ] T019 [US3] Implement scheduler orchestrator in `src/bench/scheduler.ts`: export `runAllEndpoints(db, config)` that iterates `config.bench.endpoints`, calls `runEndpoint()` for each sequentially, catches and logs per-endpoint errors without aborting the batch, logs start/completion of each run cycle
- [ ] T020 [US3] Implement cron setup script in `src/bench/setup-cron.ts`: use `Bun.cron()` to register an OS-level cron job that runs `bun run src/bench/index.ts` on the configured schedule; add `bench:setup` script to `package.json`; log confirmation of job registration

**Checkpoint**: All user stories should now be independently functional. Bench process generates live data, dashboard displays it.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T021 Implement data retention pruning: call `pruneOldRuns(db, retentionDays)` at the end of each benchmark run in `src/bench/index.ts`, and on web server startup in `src/web/index.ts`
- [ ] T022 [P] Add `console.log`/`console.error` logging throughout both components: bench logs each endpoint result (label, TPS, status), errors, and run cycle start/end; web logs startup, request paths, DB errors
- [ ] T023 [P] Create `Makefile` at project root with targets: `bench` → `bun run src/bench/index.ts`, `bench:setup` → `bun run src/bench/setup-cron.ts`, `web` → `bun run src/web/index.ts`, `test` → `bun test`, `fmt` → `bun fmt`, `typecheck` → `bunx tsc --noEmit`
- [ ] T024 Run quickstart validation: register cron job via `bench:setup`, run `bench` manually, start web process, open dashboard in browser, verify tiles and comparison graph render with live data, verify auto-refresh works

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 and US2 can proceed sequentially (US2 builds on US1's HTML)
  - US3 can proceed in parallel with US1/US2 (different process, same DB)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **User Story 2 (P2)**: Can start after Phase 2 — modifies HTML/JS from US1, so implement US1 first or coordinate on shared files
- **User Story 3 (P3)**: Can start after Phase 2 — completely independent process, can be done in parallel with US1/US2

### Within Each User Story

- Types before services
- Database queries before API handlers
- API handlers before HTML/JS
- Core rendering before polish

### Parallel Opportunities

- T002, T003, T004 can run in parallel (different files)
- T007 and T008 are sequential (migration file before schema runner)
- T010 and T011 can run in parallel (different files)
- T016, T017, and T020 can run in parallel (different files)
- T022, T023 can run in parallel (different files)
- US3 implementation can run in parallel with US1/US2

---

## Parallel Example: Phase 2

```text
# Sequential core:
Task: "T005 Define shared TypeScript types in src/shared/types.ts"
Task: "T006 Implement shared config loader in src/shared/config.ts"

# Then parallel:
Task: "T007 Create database migration in src/db/migrations/0001_initial.sql"
# (after T007)
Task: "T008 Implement database schema runner in src/db/schema.ts"
Task: "T009 Implement database query functions in src/db/queries.ts"
```

## Parallel Example: User Story 1

```text
# Parallel (different files):
Task: "T010 [P] [US1] Implement HTTP server entry point in src/web/index.ts"
Task: "T011 [P] [US1] Implement API route handlers in src/web/routes.ts"

# Then sequential:
Task: "T012 [US1] Build dashboard HTML page in src/web/static/index.html"
Task: "T013 [US1] Implement client-side tile rendering in src/web/static/app.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Seed DB with sample data, verify tiles render
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- US2 modifies HTML/JS from US1, so coordinate on `src/web/static/` files
- US3 is fully independent (separate process), can parallel with US1/US2
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
