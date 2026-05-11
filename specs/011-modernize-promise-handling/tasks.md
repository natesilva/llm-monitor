# Tasks: Modernize Promise Handling

**Input**: Design documents from `/specs/011-modernize-promise-handling/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: Not explicitly requested. Existing tests must continue to pass.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root (this project)

---

## Phase 1: Setup

**Purpose**: No project setup needed — this is a refactoring of an existing project. Skip.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational infrastructure needed — this is a pure syntax refactoring. Skip.

---

## Phase 3: User Story 1 - No .then/.catch Chains (Priority: P1) 🎯 MVP

**Goal**: Eliminate all `.catch()` chains on Promises, replacing with `try/await/catch` blocks

**Independent Test**: `grep -rn '\.catch(' src/ --include='*.ts'` returns zero hits

### Implementation for User Story 1

- [x] T001 [US1] Replace `main().catch(...)` with top-level `try { await main() } catch { ... }` in `src/bench/index.ts` (lines 58-62)
- [x] T002 [P] [US1] Replace `register().catch(...)` with `try { await register() } catch { ... }` in `src/bench/cron.ts` (lines 115-119)
- [x] T003 [P] [US1] Replace `status().catch(...)` with `try { await status() } catch { ... }` in `src/bench/cron.ts` (lines 124-128)
- [x] T004 [US1] Replace `runBench().catch(...)` with `async scheduled()` method containing `try { await runBench() } catch { ... }` in `src/bench/cron-worker.ts` (lines 9-17)

**Checkpoint**: `grep -rn '\.catch(' src/ --include='*.ts'` returns zero hits; all existing tests pass

---

## Phase 4: User Story 2 - All Promises Awaited (Priority: P2)

**Goal**: Ensure every async function call is `await`ed — no floating Promises

**Independent Test**: Search codebase for async function calls without `await` and verify zero violations

### Implementation for User Story 2

- [x] T005 [US2] Replace un-awaited `unregister()` with `try { await unregister() } catch { ... }` in `src/bench/cron.ts` (line 122)
- [x] T006 [P] [US2] Replace un-awaited `main()` with top-level `try { await main() } catch { ... }` in `src/web/index.ts` (line 49)

**Checkpoint**: No un-awaited async function calls remain; all existing tests pass

---

## Phase 5: User Story 3 - Return Await for Stack Traces (Priority: P3)

**Goal**: All `return <promise>` in async functions use `return await` for correct stack traces

**Independent Test**: Search async functions for `return` statements that return Promises without `await` and verify zero violations

### Implementation for User Story 3

- [x] T007 [P] [US3] Change `return serveFile(join(staticDir, "index.html"), "text/html")` to `return await serveFile(...)` in `src/web/routes.ts` (line 63)
- [x] T008 [P] [US3] Change `return serveFile(filePath, contentType)` to `return await serveFile(...)` in `src/web/routes.ts` (line 69)

**Checkpoint**: All `return` statements in async functions use `return await`; all existing tests pass

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification that all changes are correct and complete

- [x] T009 Run `bun test` and verify all tests pass
- [x] T010 [P] Run `bunx biome check src/` and verify lint passes
- [x] T011 [P] Run `bunx tsc --noEmit` and verify typecheck passes
- [x] T012 Verify `grep -rn '\.catch(' src/ --include='*.ts'` returns zero hits
- [x] T013 Verify no un-awaited async function calls remain in `src/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **US1 (Phase 3)**: No dependencies — can start immediately
- **US2 (Phase 4)**: No dependencies on US1 — can start in parallel, but T005 (cron.ts) overlaps with US1's T002/T003 in the same file, so apply T002+T003+T005 together
- **US3 (Phase 5)**: No dependencies on US1 or US2 — T007/T008 are in a different file
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1**: Independent — `src/bench/index.ts` and `src/bench/cron-worker.ts`
- **US2**: Overlaps US1 in `src/bench/cron.ts` (T005 + T002/T003 same file) and `src/web/index.ts` (separate)
- **US3**: Independent — `src/web/routes.ts` only

### Parallel Opportunities

- T001 (index.ts), T002+T003+T005 (cron.ts batch), T004 (cron-worker.ts), T006 (web/index.ts), T007+T008 (routes.ts) can all be done in parallel since they touch different files (except T002/T003/T005 which share cron.ts)
- T007 and T008 can run in parallel (same file but independent lines)

---

## Parallel Example: All Stories

```bash
# Since this is a small refactoring, all changes can be applied in one batch:
# Batch 1 (different files): T001, T004, T006, T007+T008
# Batch 2 (same file): T002+T003+T005 (cron.ts — 3 changes in one file)
# Then: T009-T013 (verification)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1 (eliminate `.catch()`)
2. **STOP and VALIDATE**: `grep -rn '\.catch(' src/ --include='*.ts'` returns zero; `bun test` passes
3. This alone delivers the most visible improvement

### Incremental Delivery

1. US1 → eliminate `.catch()` → validate
2. US2 → await all Promises → validate
3. US3 → `return await` → validate
4. Polish → full verification suite

### Practical Approach (Small Refactoring)

Given the small scope (4 files, 8 call sites), all changes can realistically be applied together and verified in one pass. The user story separation ensures correctness of the spec mapping, but implementation can be a single batch.

---

## Notes

- [P] tasks = different files, no dependencies
- T002/T003/T005 share `src/bench/cron.ts` — apply together
- All changes are syntax-only refactoring; no behavior changes
- Existing test suite is the primary regression check
- No new test files needed — existing tests cover the functionality
