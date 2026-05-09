# Tasks: Project Documentation (License & README)

**Input**: Design documents from `/specs/008-project-documentation/`
**Prerequisites**: plan.md (required), spec.md (required)

**Tests**: Not explicitly requested. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- Documentation files at repository root

---

## Phase 1: User Story 2 - Know the project's licensing terms (Priority: P2) 🎯 MVP

**Goal**: Repository has a valid MIT LICENSE file in the root directory

**Independent Test**: Verify `LICENSE` exists at repo root with standard MIT text and correct copyright year/holder

**Note**: US2 (license) is implemented first because US1 (README) references it (FR-007).

### Implementation for User Story 2

- [x] T001 [US2] Create `LICENSE` file in repository root with standard MIT license text, copyright year 2026, copyright holder Nate

**Checkpoint**: LICENSE file exists and is valid

---

## Phase 2: User Story 1 - Understand the project from GitHub (Priority: P1)

**Goal**: Repository has a comprehensive README.md that renders correctly on GitHub, covering description, installation, usage, configuration, and license

**Independent Test**: View README.md on GitHub and verify all sections render correctly and are accurate to current project functionality

### Implementation for User Story 1

- [x] T002 [US1] Create `README.md` in repository root with the following sections: project title and description, features overview, prerequisites (Bun), installation steps (clone, install deps, copy config), usage (running benchmarks with `bun run bench`, scheduling with `bun run cron register`/`unregister`/`status`, web dashboard with `bun run web`), configuration (reference `config.example.ts` and `.env`), and license section referencing the MIT LICENSE file
- [x] T003 [US1] Validate README.md renders correctly — verify no broken Markdown, all commands match current `package.json` scripts, and configuration instructions match `config.example.ts`

**Checkpoint**: README is complete and renders correctly on GitHub

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Final validation

- [x] T004 Verify both files exist at repository root and are tracked by git

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 2 (Phase 1)**: No dependencies — can start immediately
- **User Story 1 (Phase 2)**: Depends on US2 (README references LICENSE)
- **Polish (Phase 3)**: Depends on both user stories being complete

### User Story Dependencies

- **User Story 2 (P2)**: No dependencies
- **User Story 1 (P1)**: Depends on US2 (FR-007: README must reference the license)

---

## Parallel Opportunities

- None — only 4 tasks, and T002 depends on T001

---

## Implementation Strategy

### MVP First (User Story 2 Only)

1. Create LICENSE file
2. **STOP and VALIDATE**: Verify LICENSE is valid

### Incremental Delivery

1. Create LICENSE → License established
2. Create README → Complete documentation
3. Polish → Final validation

---

## Notes

- README must document current features only (bench, cron, web dashboard)
- All CLI commands in README must match current `package.json` scripts
- Configuration section should reference `config.example.ts` rather than duplicating its contents
