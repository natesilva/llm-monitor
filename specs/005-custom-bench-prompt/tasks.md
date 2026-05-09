# Tasks: Custom Bench Prompt

**Input**: Design documents from `/specs/005-custom-bench-prompt/`
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

**Purpose**: No setup needed — this feature modifies existing bench runner files and a config default only.

No tasks in this phase.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational work needed — the bench runner and `util.parseArgs` pattern already exist (feature 004).

No tasks in this phase.

---

## Phase 3: User Story 1 - Custom Prompt via CLI Flag (Priority: P1) 🎯 MVP

**Goal**: Running `bun run bench --prompt "custom text"` sends that text as the user message to each endpoint; without `--prompt`, the default "What is photosynthesis? Give a brief overview." is used.

**Independent Test**: Run `bun run bench --debug --prompt "test prompt"` and verify `[label] Request:` output shows `"content": "test prompt"`. Run `bun run bench --debug` without `--prompt` and verify the default prompt appears.

### Implementation for User Story 1

- [x] T001 [US1] Change `DEFAULTS.promptTemplate` in `src/shared/config.ts` from `"Hello, please respond with a short greeting."` to `"What is photosynthesis? Give a brief overview."`
- [x] T002 [US1] Add `prompt: { type: "string" }` option to the `parseArgs` call in `src/bench/index.ts`, extract `const prompt: string | undefined = values.prompt;`, and pass it as the fourth argument to `runAllEndpoints(db, endpoints, debug, prompt)`
- [x] T003 [US1] Add `prompt: string | undefined` parameter to `runAllEndpoints()` in `src/bench/scheduler.ts`, pass it as the fourth argument to each `runEndpoint(db, endpoint, debug, prompt)` call
- [x] T004 [US1] Add `prompt: string | undefined` parameter to `runEndpoint()` in `src/bench/runner.ts`, and change the request body's `messages` content from `endpoint.promptTemplate` to `(prompt ?? endpoint.promptTemplate)` so the CLI flag overrides the config value
- [x] T005 [US1] Update the `--help` usage text in `src/bench/index.ts` to include `--prompt <text>  Specify the prompt text sent to each endpoint`
- [x] T006 [US1] Verify typecheck passes with `bunx tsc --noEmit`
- [x] T007 [US1] Verify lint passes with `bunx biome check src/`
- [x] T008 [US1] Run quickstart validation: run `bun run bench --debug` (default prompt "What is photosynthesis?" in request), `bun run bench --debug --prompt "test"` (`"content": "test"` in request), and `bun run bench --help` (`--prompt` listed in help output)

**Checkpoint**: `--prompt` flag is fully functional. CLI prompt overrides config; default prompt updated; cron runs unaffected.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: No polish needed — this is a minimal, focused change.

No tasks in this phase.

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (Phase 3)**: No dependencies on other phases — can start immediately

### Within User Story 1

- T001 is independent (different file from T002-T005)
- T002 → T003 → T004 are sequential (parameter threading through the call chain)
- T005 depends on T002 (same parseArgs call in index.ts)
- T006 and T007 depend on T001-T005
- T008 depends on T006 and T007

### Parallel Opportunities

- T001 can run in parallel with T002-T005 (different file: config.ts vs bench files)

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Change default prompt in `src/shared/config.ts`
2. Add `--prompt` to `parseArgs` in `src/bench/index.ts`
3. Thread `prompt` param through `scheduler.ts` to `runner.ts`
4. Apply override in `runner.ts` request body construction
5. Update help text
6. Typecheck + lint + verify

---

## Notes

- 4 files modified: `src/shared/config.ts`, `src/bench/index.ts`, `src/bench/scheduler.ts`, `src/bench/runner.ts`
- No new files, no schema changes, no web/dashboard/cron changes
- The `--prompt` flag is a runtime CLI option only — cron jobs invoke `bun run src/bench/index.ts` without it, so cron behavior is unchanged
- `--prompt` is a string type argument (requires a value), unlike `--debug` and `--help` which are booleans
- Empty string is valid for `--prompt` (user explicitly chose it)
- No client-side length limit; the API enforces its own limits
