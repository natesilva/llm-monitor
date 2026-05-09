# Tasks: Web Auto-Reload

**Input**: Design documents from `/specs/006-web-auto-reload/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `package.json` and `Makefile` at repository root

---

## Phase 1: Setup

**Purpose**: No project structure changes needed — this feature is a script addition only.

No tasks required in this phase.

---

## Phase 2: Foundational

**Purpose**: No blocking prerequisites — the feature uses `bun --watch` (built-in) with no new source code or infrastructure.

No tasks required in this phase.

---

## Phase 3: User Story 1 - Automatic Web Server Restart on Code Changes (Priority: P1) 🎯 MVP

**Goal**: Add a `web:dev` npm script and `web-dev` Makefile target that runs the web server with `bun --watch`, enabling automatic restart on source file changes. The default `web` command remains unchanged.

**Independent Test**: Run `bun run web:dev`, edit a file in `src/`, verify the server restarts automatically. Then run `bun run web` and confirm no file-watching behavior.

### Implementation for User Story 1

- [x] T001 [P] [US1] Add `"web:dev": "bun --watch src/web/index.ts"` script to package.json
- [x] T002 [P] [US1] Add `web-dev` target to Makefile running `bun --watch src/web/index.ts`
- [x] T003 [US1] Add `web-dev` to `.PHONY` declaration in Makefile
- [x] T004 [US1] Run lint and typecheck to verify no regressions

**Checkpoint**: User Story 1 is complete — `bun run web:dev` starts the server with auto-reload, `bun run web` behaves unchanged.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation

- [x] T005 Run quickstart.md validation: start `web:dev`, edit a source file, verify auto-restart; start `web`, verify no watching

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks
- **Foundational (Phase 2)**: No tasks
- **User Story 1 (Phase 3)**: Can start immediately — no prerequisite phases
- **Polish (Phase 4)**: Depends on Phase 3 completion

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories — this is the only story

### Within User Story 1

- T001 and T002 are parallel (different files)
- T003 depends on T002 (same file, adds .PHONY entry)
- T004 depends on T001 and T002 (validates both changes)

### Parallel Opportunities

- T001 (package.json) and T002 (Makefile) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch both script additions together:
Task: "Add web:dev script to package.json"
Task: "Add web-dev target to Makefile"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1 (T001–T004)
2. **STOP and VALIDATE**: Test `bun run web:dev` with a file edit
3. Complete Phase 4: Quickstart validation (T005)

### Incremental Delivery

This feature has a single user story, so delivery is one increment.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No source code changes — only package.json and Makefile
- `bun --watch` handles debouncing, error recovery, and process lifecycle natively
- Commit after each task or logical group
