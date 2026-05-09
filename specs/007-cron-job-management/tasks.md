# Tasks: Cron Job Registration & Unregistration

**Input**: Design documents from `/specs/007-cron-job-management/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/cli.md

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root
- Tests co-located with source files

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the unified cron CLI entry point and shared constants, remove the superseded setup-cron script

- [x] T001 Create `src/bench/cron.ts` with CRON_JOB_NAME constant (`"LLM_Monitor_Bench"`), CLI argument parsing for subcommands (`register`, `unregister`, `status`), and a usage/help message for unknown or missing subcommands
- [x] T002 [P] Delete `src/bench/setup-cron.ts` (replaced by `src/bench/cron.ts`)
- [x] T003 [P] Delete `src/bench/setup-cron.test.ts` (replaced by tests in `src/bench/cron.test.ts`)
- [x] T004 Update `package.json` — remove `bench:setup` script, add `cron` script pointing to `src/bench/cron.ts`
- [x] T005 Update `Makefile` — remove `bench-setup` target, add `cron-register`, `cron-unregister`, `cron-status` targets

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement the OS-level cron job status detection helper that all three user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Implement `isCronJobRegistered(name: string): Promise<boolean>` helper in `src/bench/cron.ts` — checks OS scheduler for the job: on macOS runs `launchctl list` and searches for `bun.cron.<name>`, on Linux runs `crontab -l` and searches for the job name. Returns `true` if found, `false` otherwise. Handles errors (e.g., no crontab) gracefully by returning `false`.

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Register the scheduled bench job (Priority: P1) 🎯 MVP

**Goal**: User can run `bun run cron register` to register (or re-register) the OS-level cron job, with clear confirmation output

**Independent Test**: Run `bun run cron register` with a valid config.ts, verify launchd/crontab entry exists and output shows job details

### Implementation for User Story 1

- [x] T007 [US1] Implement `register()` function in `src/bench/cron.ts` — loads config via existing `loadConfig()`, resolves worker path to `cron-worker.ts`, calls `Bun.cron(workerPath, schedule, CRON_JOB_NAME)`, checks `isCronJobRegistered()` before registering to determine if this is a new registration or an update, and prints the appropriate confirmation message per contracts/cli.md (title, schedule, worker path). Exits with code 1 if config is missing or invalid.
- [x] T008 [US1] Wire `register` subcommand in `src/bench/cron.ts` CLI dispatcher to call the `register()` function

**Checkpoint**: User Story 1 is functional — `bun run cron register` works end-to-end

---

## Phase 4: User Story 2 - Unregister the scheduled bench job (Priority: P2)

**Goal**: User can run `bun run cron unregister` to remove the OS-level cron job, with clear feedback about whether a job was found and removed

**Independent Test**: Register a cron job, then run `bun run cron unregister`, verify the launchd/crontab entry is gone and output confirms removal

### Implementation for User Story 2

- [x] T009 [US2] Implement `unregister()` function in `src/bench/cron.ts` — calls `isCronJobRegistered(CRON_JOB_NAME)` first, then if registered calls `Bun.cron.remove(CRON_JOB_NAME)` and prints "Cron job removed." with the title; if not registered prints "No cron job found with title ..." per contracts/cli.md. Always exits with code 0 (missing job is not an error, per FR-007).
- [x] T010 [US2] Wire `unregister` subcommand in `src/bench/cron.ts` CLI dispatcher to call the `unregister()` function

**Checkpoint**: User Stories 1 AND 2 both work independently

---

## Phase 5: User Story 3 - Check the status of the scheduled bench job (Priority: P3)

**Goal**: User can run `bun run cron status` to check whether the cron job is registered and see its details

**Independent Test**: Run `bun run cron status` with and without a registered job, verify output matches contracts/cli.md

### Implementation for User Story 3

- [x] T011 [US3] Implement `status()` function in `src/bench/cron.ts` — calls `isCronJobRegistered(CRON_JOB_NAME)`. If registered, loads config to display the schedule and resolves the worker path, printing per contracts/cli.md (title, schedule, worker). If not registered, prints "No cron job registered..." with a hint to run `bun run cron register`.
- [x] T012 [US3] Wire `status` subcommand in `src/bench/cron.ts` CLI dispatcher to call the `status()` function

**Checkpoint**: All three user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ensure code quality and validate end-to-end

- [x] T013 Run `bun run lint` and fix any issues
- [x] T014 Run `bun run typecheck` and fix any issues
- [x] T015 Validate quickstart.md scenarios: run `bun run cron register`, then `bun run cron status`, then `bun run cron unregister`, then `bun run cron status` again — verify output matches contracts/cli.md in all four cases

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational phase completion
  - US1, US2, US3 can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2 (`isCronJobRegistered`). No dependencies on other stories.
- **User Story 2 (P2)**: Depends on Phase 2 (`isCronJobRegistered`). No dependencies on US1 (but logically follows — register before unregister).
- **User Story 3 (P3)**: Depends on Phase 2 (`isCronJobRegistered`). No dependencies on US1 or US2.

### Within Each User Story

- Implementation function before wiring into CLI dispatcher
- Core logic before output formatting

### Parallel Opportunities

- T002 and T003 can run in parallel (deleting old files)
- T004 and T005 can run in parallel (updating package.json and Makefile)
- After Phase 2, all three user story implementations can run in parallel

---

## Parallel Example: Phase 1

```bash
# Launch deletions together:
Task T002: "Delete src/bench/setup-cron.ts"
Task T003: "Delete src/bench/setup-cron.test.ts"

# Launch config updates together:
Task T004: "Update package.json scripts"
Task T005: "Update Makefile targets"
```

## Parallel Example: User Stories (after Phase 2)

```bash
# All three stories can be developed in parallel:
Task T007-T008: "Implement register (US1)"
Task T009-T010: "Implement unregister (US2)"
Task T011-T012: "Implement status (US3)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (`isCronJobRegistered`)
3. Complete Phase 3: User Story 1 (register)
4. **STOP and VALIDATE**: Test `bun run cron register` end-to-end
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (register) → Test independently → MVP!
3. Add User Story 2 (unregister) → Test independently → Full lifecycle
4. Add User Story 3 (status) → Test independently → Complete feature
5. Polish → Lint, typecheck, end-to-end validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The `cron-worker.ts` and `cron-worker.test.ts` files are NOT modified by this feature
