# Tasks: Clean Up Web UI Stats Display

**Input**: Design documents from `/specs/014-cleanup-web-stats/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested — verification tasks included instead.

**Organization**: Tasks are grouped by user story to enable independent verification of each story.

**Note**: Research found all requirements already implemented (see research.md). Tasks are verification-focused.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Ensure the development environment is ready for verification

- [x] T001 Checkout branch `014-cleanup-web-stats` and verify working tree is clean
- [x] T002 Run `bun test` to confirm existing test suite passes before verification

---

## Phase 2: Foundational (Verification Prerequisites)

**Purpose**: Not applicable — no blocking prerequisites for this verification-only feature

No foundational tasks required. The codebase already has all infrastructure in place.

---

## Phase 3: User Story 1 - Focused Stat Cards (Priority: P1) 🎯 MVP

**Goal**: Verify that per-configuration stat cards display exactly three summary statistics: Avg TPS, Avg TT100T, and TPS StdDev

**Independent Test**: Load dashboard and confirm each tile shows exactly 3 stats with correct values and labels

### Verification for User Story 1

- [x] T003 [US1] Verify stat card HTML in `src/web/static/app.js` lines 210-214 renders exactly three stats: Avg TPS, Avg TT100T, TPS StdDev
- [x] T004 [P] [US1] Verify stat card update path in `src/web/static/app.js` lines 324-332 updates exactly three `.stat-value` elements
- [x] T005 [P] [US1] Verify null TT100T handling shows "N/A" in stat cards — check `src/web/static/app.js` lines 212 and 329
- [x] T006 [US1] Verify CSS grid layout in `src/web/static/index.html` lines 186-189 uses `repeat(3, 1fr)` for three-column stat display

**Checkpoint**: Stat cards verified — exactly 3 stats shown, null handling correct

---

## Phase 4: User Story 2 - TT100T Comparison Graph (Priority: P1)

**Goal**: Verify that the comparison graph plots TT100T on the Y-axis and displays a "lower is better" note

**Independent Test**: Select multiple configurations and confirm the comparison chart shows TT100T values with the annotation

### Verification for User Story 2

- [x] T007 [US2] Verify comparison chart data source in `src/web/static/app.js` lines 374-376 uses `d.tt100tMs` for Y-axis values
- [x] T008 [P] [US2] Verify comparison chart Y-axis title in `src/web/static/app.js` line 418 is set to `"TT100T (ms)"`
- [x] T009 [P] [US2] Verify null TT100T filtering in `src/web/static/app.js` line 375 excludes null data points from chart
- [x] T010 [US2] Verify "lower is better" note in `src/web/static/index.html` line 321 with `.comparison-note` CSS at lines 99-105

**Checkpoint**: Comparison graph verified — TT100T plotted, "lower is better" note visible

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and code quality checks

- [x] T011 Run `bun test` to confirm all tests still pass after verification
- [x] T012 Run quickstart.md validation — start web server and manually verify stat cards and comparison chart in browser

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Not applicable
- **User Story 1 (Phase 3)**: Depends on Phase 1 completion
- **User Story 2 (Phase 4)**: Depends on Phase 1 completion — can run in parallel with Phase 3
- **Polish (Phase 5)**: Depends on Phase 3 and Phase 4 completion

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on US2 — independently verifiable
- **User Story 2 (P1)**: No dependencies on US1 — independently verifiable

### Parallel Opportunities

- T004 and T005 can run in parallel (same file but different code sections, both read-only verification)
- T008 and T009 can run in parallel (same file but different code sections, both read-only verification)
- Phase 3 and Phase 4 can run in parallel (verifying different UI components)

---

## Parallel Example: User Stories 1 & 2

```bash
# Verify stat cards and comparison graph in parallel:
Task: "Verify stat card HTML in src/web/static/app.js lines 210-214"
Task: "Verify comparison chart data source in src/web/static/app.js lines 374-376"
```

---

## Implementation Strategy

### Verification-Only Approach

1. Complete Phase 1: Setup (run tests, confirm clean state)
2. Complete Phase 3 + Phase 4 in parallel: Verify both user stories
3. Complete Phase 5: Final test run and manual browser validation
4. If any verification fails: File a bug and create implementation tasks to fix

### Key Decision

Research confirms all functional requirements (FR-001 through FR-005) are already implemented from the previous `013-add-tt100t-metric` feature. These tasks verify the implementation is correct rather than build new functionality.

---

## Notes

- [P] tasks = different code sections, no write dependencies
- [Story] label maps task to specific user story for traceability
- All tasks are verification/read-only — no code changes expected
- If verification reveals gaps, implementation tasks should be added
- Commit after each completed verification phase
