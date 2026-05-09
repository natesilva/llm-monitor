# Tasks: Add Project Linter (BiomeJS)

**Input**: Design documents from `/specs/003-biomejs-linter/`
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

**Purpose**: Install BiomeJS and create configuration

- [x] T001 Install `@biomejs/biome` as a dev dependency via `bun add -d @biomejs/biome`
- [x] T002 [P] Create `biome.json` at project root with: `formatter.indentStyle: "space"`, `linter.enabled: true` with recommended rules, ignore patterns for `src/web/static/*.html` and `specs/`, and JavaScript/TypeScript default settings

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Integrate Biome into the existing toolchain, replacing Prettier

- [x] T003 Replace the `fmt` script in `package.json` from `bunx prettier --write 'src/**/*.ts' 'src/**/*.js'` to `bunx biome check --write src/`
- [x] T004 [P] Add a `lint` script to `package.json`: `bunx biome check src/`
- [x] T005 [P] Replace the `fmt` target in `Makefile` from `bunx prettier --write "src/**/*.ts" "src/**/*.js"` to `bunx biome check --write src/`
- [x] T006 [P] Add a `lint` target to `Makefile`: `bunx biome check src/` and add `lint` to the `.PHONY` list

**Checkpoint**: Biome is installed, configured, and integrated into the toolchain. Prettier is fully replaced.

---

## Phase 3: User Story 1 - Automated Code Quality Checks (Priority: P1) 🎯 MVP

**Goal**: Running `bun run lint` checks all source files for code quality issues and reports violations.

**Independent Test**: Run `bunx biome check src/` and verify it reports issues or passes cleanly. Introduce a known lint violation (e.g., unused variable) and verify it's caught.

### Implementation for User Story 1

- [x] T007 [US1] Run `bunx biome check src/` on the existing codebase, capture the output, and fix all lint errors in `src/` files (modify files as needed to pass)
- [x] T008 [US1] Run `bunx biome lint src/` to verify lint-only mode works correctly with zero errors
- [x] T009 [US1] Verify typecheck still passes with `bunx tsc --noEmit`

**Checkpoint**: `bun run lint` passes with zero errors. Linting is fully functional.

---

## Phase 4: User Story 2 - Integrated Formatting (Priority: P2)

**Goal**: Running `bun run fmt` auto-fixes both lint and formatting issues. The formatter replaces Prettier completely.

**Independent Test**: Run `bun run fmt` and verify files are reformatted. Run `bun run lint` after and verify zero errors.

### Implementation for User Story 2

- [x] T010 [US2] Run `bunx biome check --write src/` to auto-format all source files with Biome's formatter, fixing any remaining formatting differences from Prettier
- [x] T011 [US2] Verify `bun run lint` still passes with zero errors after formatting changes
- [x] T012 [US2] Verify typecheck still passes with `bunx tsc --noEmit` after formatting changes

**Checkpoint**: `bun run fmt` reformats files and `bun run lint` confirms zero issues. Formatting is fully functional.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation

- [x] T013 Run quickstart validation per `specs/003-biomejs-linter/quickstart.md`: verify `bun install`, `bun run lint`, `bun run fmt`, and `bun run typecheck` all pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 3 completion (formatting builds on clean lint baseline)
- **Polish (Phase 5)**: Depends on all user stories being complete

### Within Each User Story

- T007 (fix lint errors) depends on T001-T006 (Biome installed and integrated)
- T008 and T009 depend on T007
- T010 depends on T007 (must have clean lint baseline before formatting)
- T011 and T012 depend on T010

### Parallel Opportunities

- T002 can run in parallel with T001 (different files)
- T004 and T005 and T006 can run in parallel (different files: package.json, Makefile)

---

## Parallel Example: Phase 2

```text
# After T003 is done (package.json fmt script changed):
Task: "T004 Add lint script to package.json"
Task: "T005 Replace fmt target in Makefile"
Task: "T006 Add lint target to Makefile"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Install Biome + create config (Phase 1)
2. Integrate into toolchain (Phase 2)
3. Fix lint errors in existing code (Phase 3)
4. **STOP and VALIDATE**: `bun run lint` passes

### Full Delivery

1. Complete MVP (Phases 1-3)
2. Run formatter on all files (Phase 4)
3. Final validation (Phase 5)

---

## Notes

- Biome replaces Prettier entirely — no need to uninstall Prettier (it's not in devDependencies, only used via `bunx`)
- `bunx biome check` does both lint + format checking; `bunx biome lint` does lint only
- The `// @ts-ignore` comments in 3 files may trigger Biome lint rules — handle by suppressing with Biome's `// biome-ignore` directive if needed
- HTML files in `src/web/static/` are excluded from Biome via config
- `config.example.ts` at project root is also excluded (it's a template, not source)
