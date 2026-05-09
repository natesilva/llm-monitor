# Tasks: Persist Comparison Graph Selection

**Input**: Design documents from `/specs/010-persist-comparison-selection/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Not explicitly requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: No blocking prerequisites — the feature modifies a single existing file with no new infrastructure.

No setup tasks needed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared helpers that all user stories depend on. Both helpers include full error handling so they are production-ready before any user story work begins.

- [x] T001 Add `saveComparisonSelection()` helper in `src/web/static/app.js` — serializes `activeConfigs` Set to JSON and writes to `localStorage.setItem("comparison-configs", ...)`. Wrap `setItem` in try/catch to silently fail if localStorage is unavailable or full.
- [x] T002 Add `loadComparisonSelection()` helper in `src/web/static/app.js` — reads `localStorage.getItem("comparison-configs")`, parses JSON array with try/catch, returns array of strings. Returns empty array on missing key, parse error, or invalid data (e.g. non-array values).

**Checkpoint**: Helper functions in place — user story implementation can begin

---

## Phase 3: User Story 1 - Restore Previous Selection on Reload (Priority: P1) 🎯 MVP

**Goal**: When a user reloads the page, their previously selected Comparison graph configurations are restored. Stale labels (no longer in `allConfigs`) are silently filtered out, satisfying FR-004.

**Independent Test**: Select a subset of configurations, reload the page, verify the same subset is active and the chart reflects it.

### Implementation for User Story 1

- [x] T003 [US1] Call `loadComparisonSelection()` at the start of `renderToggles()` in `src/web/static/app.js` — populate `activeConfigs` from saved labels, filtering out any that don't exist in `allConfigs` (depends on T001, T002)
- [x] T004 [US1] Call `saveComparisonSelection()` in the toggle button click handler in `renderToggles()` in `src/web/static/app.js` — save after both add and delete operations (depends on T001, T002)

**Checkpoint**: User Story 1 complete — selection persists across page reloads, stale entries are filtered

---

## Phase 4: User Story 2 - Clean Default for New Users (Priority: P2)

**Goal**: First-time visitors (no saved preference) see all configurations selected, identical to current behavior.

**Independent Test**: Clear `localStorage`, load the page, verify all configurations are selected.

### Implementation for User Story 2

- [x] T005 [US2] Verify (no code change expected) that the existing fallback in `renderToggles()` handles empty `activeConfigs` correctly after loading from localStorage — when `loadComparisonSelection()` returns no valid configs, the existing `if (activeConfigs.size === 0)` block should select all (depends on T003)

**Checkpoint**: User Story 2 complete — new users see the same default behavior as before

---

## Phase 5: User Story 3 - Stale Selection Graceful Handling (Priority: P3)

**Goal**: Stale configuration labels in localStorage are silently ignored without errors. This is already handled by T002 (try/catch on parse) and T003 (filter against `allConfigs`). This phase is verification-only.

**Independent Test**: Set `localStorage.setItem("comparison-configs", '["nonexistent"]')`, reload, verify all real configs are selected.

### Implementation for User Story 3

- [x] T006 [US3] Verify (no code change expected) that stale labels are filtered by T003's `allConfigs` check and invalid localStorage data is handled by T002's try/catch — manually test with stale and corrupted localStorage values per quickstart.md (depends on T002, T003)

**Checkpoint**: User Story 3 complete — stale entries are handled gracefully (verified)

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification and cleanup

- [x] T007 Run lint, typecheck, and test suite to verify no regressions
- [x] T008 Run quickstart.md validation — manual browser verification of all three user stories

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — can start immediately
- **User Story 1 (Phase 3)**: Depends on T001, T002 (Foundational)
- **User Story 2 (Phase 4)**: Depends on T003 (US1 implementation)
- **User Story 3 (Phase 5)**: Depends on T002, T003 (Foundational + US1)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational only
- **User Story 2 (P2)**: Verification only — confirmed by US1's correct fallback handling
- **User Story 3 (P3)**: Verification only — confirmed by T002 (error handling) + T003 (stale filtering)

### Parallel Opportunities

- T001 and T002 can run in parallel (different functions, no interdependencies)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001, T002)
2. Complete Phase 3: User Story 1 (T003, T004)
3. **STOP and VALIDATE**: Select configs, reload, verify persistence
4. Deploy/demo if ready

### Full Delivery

1. Foundational → US1 → US2 → US3 → Polish
2. Each story adds value without breaking previous ones
