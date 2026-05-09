# Tasks: Web UI Quality-of-Life Improvements

**Input**: Design documents from `/specs/009-web-ui-qol/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: No test tasks included — not explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the shared type and query needed by both user stories

- [x] T001 Add `DataPointsResponse` type to `src/shared/types.ts`
- [x] T002 Add `getDataPointsForConfig()` query function to `src/db/queries.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Convert existing hardcoded dark-mode colors to CSS custom properties so both user stories can build on a themeable base

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Replace all hardcoded color values in `src/web/static/index.html` `<style>` block with CSS custom properties defined under `[data-theme="dark"]` and `[data-theme="light"]` selectors on `:root`, and set `data-theme="dark"` on the `<html>` element as the initial attribute

**Checkpoint**: Foundation ready — all existing colors are now themeable via CSS custom properties; dashboard still renders identically in dark mode

---

## Phase 3: User Story 1 - Switch display mode (Priority: P1) 🎯 MVP

**Goal**: Users can select light, dark, or auto display mode; the choice persists and auto mode follows the system preference

**Independent Test**: Switch between Light/Auto/Dark in the header toggle — verify dashboard updates immediately, persists on reload, and auto mode follows system preference changes

### Implementation for User Story 1

- [x] T004 [US1] Add a segmented theme toggle (Light / Auto / Dark) to the page header in `src/web/static/index.html`, styled with the existing `toggle-btn` pattern and placed right-aligned next to the subtitle
- [x] T005 [US1] Implement theme initialization, persistence (`localStorage` key `theme`), `matchMedia` listener for auto mode, and toggle click handler in `src/web/static/app.js` — set `data-theme` attribute on `<html>` and update `localStorage` on user selection
- [x] T006 [US1] Implement `updateChartsTheme()` function in `src/web/static/app.js` that updates `Chart.defaults.color` and `Chart.defaults.borderColor`, then calls `chart.update("none")` on `comparisonChart` and all `tileCharts` entries; call it from the theme change handler

**Checkpoint**: At this point, User Story 1 should be fully functional — users can switch modes, auto follows system, choice persists across reloads, charts retheme correctly

---

## Phase 4: User Story 2 - View recent data points for a configuration (Priority: P2)

**Goal**: Each configuration tile has a clickable button that opens a dialog overlay showing a table of recent data points

**Independent Test**: Click the data button on any tile — verify the overlay appears with a data table (timestamp, TPS, latency, HTTP status), and can be dismissed via close button, backdrop click, or Escape

### Implementation for User Story 2

- [x] T007 [P] [US2] Add `GET /api/metrics/data-points` route to `src/web/routes.ts` — accept `config` (required), `hours` (default 48), `limit` (default 50) query params; return 400 if `config` missing; call `getDataPointsForConfig()` and return JSON
- [x] T008 [P] [US2] Add a `<dialog>` element with a close button, title, and empty `<table>` to `src/web/static/index.html` after the `<section>` elements; add overlay/table CSS styles using the same CSS custom properties so it adapts to both themes
- [x] T009 [US2] Add a "View data" button to each configuration tile in the tile rendering logic in `src/web/static/app.js` — place it in `.tile-header` next to the model name
- [x] T010 [US2] Implement overlay open/close logic in `src/web/static/app.js` — on button click, fetch from `/api/metrics/data-points?config=<label>`, populate the dialog table rows, and call `dialog.showModal()`; on close button click, backdrop click, or Escape, call `dialog.close()`; handle empty state when no data points returned

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently — theme toggle works and overlay shows data, both adapt to light/dark mode

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verification and cleanup across both user stories

- [x] T011 Run `make lint`, `make typecheck`, and `make test` to verify all checks pass
- [x] T012 Run quickstart.md validation: `make web-dev`, verify theme toggle, overlay, and mode persistence in browser

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — no dependency on US2
- **User Story 2 (Phase 4)**: Depends on Foundational + T001/T002 from Setup — no dependency on US1
- **Polish (Phase 5)**: Depends on both user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — no dependencies on US2
- **User Story 2 (P2)**: Can start after Phase 1 (needs T001/T002) + Phase 2 — no dependencies on US1

### Within Each User Story

- CSS/HTML structure before JavaScript logic
- API route before client-side fetching code

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T007 and T008 can run in parallel (different files: routes.ts vs index.html)

---

## Parallel Example: User Story 2

```bash
# Launch these together (different files):
Task T007: "Add GET /api/metrics/data-points route to src/web/routes.ts"
Task T008: "Add <dialog> element and overlay CSS to src/web/static/index.html"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002)
2. Complete Phase 2: Foundational (T003)
3. Complete Phase 3: User Story 1 (T004–T006)
4. **STOP and VALIDATE**: Test theme switching, persistence, auto mode, chart retheming
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Polish → Final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
