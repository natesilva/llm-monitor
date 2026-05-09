# Tasks: Bench Debug Flag

**Input**: Design documents from `/specs/004-bench-debug-flag/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md

**Tests**: Not explicitly requested. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project root**: `src/` at repository root
- Paths based on plan.md structure (single-package project)

---

## Phase 1: Setup

**Purpose**: No setup needed — this feature modifies existing bench runner files only.

No tasks in this phase.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational work needed — the bench runner already exists.

No tasks in this phase.

---

## Phase 3: User Story 1 - Verbose Request/Response Logging (Priority: P1) 🎯 MVP

**Goal**: Running `bun run bench --debug` prints the request body and response body for each endpoint; without `--debug`, output is unchanged.

**Independent Test**: Run `bun run bench --debug` and verify request/response lines appear. Run `bun run bench` without the flag and verify output matches current behavior.

### Implementation for User Story 1

- [x] T001 [US1] Parse `--debug` flag in `src/bench/index.ts` using `util.parseArgs`: `import { parseArgs } from "node:util"; const { values } = parseArgs({ args: Bun.argv, options: { debug: { type: "boolean" } }, strict: true, allowPositionals: true }); const debug = values.debug ?? false;` — pass `debug` as third argument to `runAllEndpoints(db, endpoints, debug)`
- [x] T002 [US1] Add `debug: boolean` parameter to `runAllEndpoints()` in `src/bench/scheduler.ts`, pass it as the third argument to each `runEndpoint(db, endpoint, debug)` call
- [x] T003 [US1] Add `debug: boolean` parameter to `runEndpoint()` in `src/bench/runner.ts`, and after the request body is constructed (line ~23), add: if debug is true, print `[${label}] Request: ${JSON.stringify(body)}`
- [x] T004 [US1] In `src/bench/runner.ts`, after the response text is captured (`const text = await res.text()`, line ~50), add: if debug is true, print `[${label}] Response: ${text.slice(0, 1000)}${text.length > 1000 ? "..." : ""}`
- [x] T005 [US1] Add `help` option to the `parseArgs` call in `src/bench/index.ts`: add `help: { type: "boolean" }` to options. After parsing, if `values.help` is true, print usage text (description of `--debug` and `--help` flags) and exit with code 0
- [x] T006 [US1] Verify typecheck passes with `bunx tsc --noEmit`
- [x] T007 [US1] Verify lint passes with `bunx biome check src/`
- [x] T008 [US1] Run quickstart validation: run `bun run bench` (no flag — output unchanged), `bun run bench --debug` (request/response lines visible), and `bun run bench --help` (usage text printed)

**Checkpoint**: Debug flag is fully functional. `--debug` shows request/response; default behavior is unchanged.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: No polish needed — this is a minimal, focused change.

No tasks in this phase.

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (Phase 3)**: No dependencies on other phases — can start immediately

### Within User Story 1

- T001 → T002 → T003 → T004 are sequential (parameter threading through the call chain)
- T005 depends on T001 (modifies same parseArgs call in index.ts)
- T006 and T007 depend on T001-T005
- T008 depends on T006 and T007

### Parallel Opportunities

- None — all tasks modify files in the same dependency chain

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Parse `--debug` flag in `src/bench/index.ts`
2. Thread `debug` param through `scheduler.ts` to `runner.ts`
3. Add request/response logging in `runner.ts` when debug is true
4. Typecheck + lint + verify

---

## Notes

- Only 3 files modified: `src/bench/index.ts`, `src/bench/scheduler.ts`, `src/bench/runner.ts`
- No new files, no schema changes, no config changes
- The `--debug` flag is a runtime CLI option only — cron jobs invoke `bun run src/bench/index.ts` without it, so cron behavior is unchanged
- Response output is truncated to 1000 characters with `...` suffix
- Request body is not truncated (it's small and constructed by the runner)
