# Tasks: Cache-Bust Request User

**Input**: Design documents from `/specs/002-cache-bust-user/`
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

**Purpose**: No setup needed — this feature modifies existing code only.

No tasks in this phase.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational work needed — the bench runner already exists.

No tasks in this phase.

---

## Phase 3: User Story 1 - Unique Per-Request Identifier (Priority: P1) 🎯 MVP

**Goal**: Each benchmark request includes a unique `user` field in the request body, preventing inference servers from returning cached responses.

**Independent Test**: Run `bun run bench` twice and verify that each request includes a different `user` value (check logs or add temporary logging). Consecutive runs should show varying latencies, not identical cached responses.

### Implementation for User Story 1

- [x] T001 [US1] Add `user: crypto.randomUUID()` to the request body in `src/bench/runner.ts`, adding it as a field in the `body` object (line 12-17) alongside `model`, `messages`, `temperature`, and `max_tokens`
- [x] T002 [US1] Add a fallback so that if `crypto.randomUUID()` is unavailable, `Date.now().toString()` is used instead, in `src/bench/runner.ts`
- [x] T003 [US1] Verify typecheck passes with `bunx tsc --noEmit`
- [x] T004 [US1] Run quickstart validation: run `bun run bench` and verify requests succeed with the `user` field included

**Checkpoint**: Benchmark requests now include a unique `user` value per request. Cached responses are effectively prevented.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: No polish needed — this is a minimal, focused change.

No tasks in this phase.

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (Phase 3)**: No dependencies on other phases — can start immediately

### Within User Story 1

- T001 is the core change
- T002 is a safety fallback (can be done alongside T001)
- T003 depends on T001 and T002
- T004 depends on T003

### Parallel Opportunities

- T001 and T002 touch the same file but the same code region — implement sequentially

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Add `user` field with `crypto.randomUUID()` to `src/bench/runner.ts`
2. Add fallback for edge case
3. Typecheck
4. Run bench and verify

---

## Notes

- Single-file change — no new files, no schema changes, no config changes
- `crypto.randomUUID()` is available natively in Bun runtime
- The `user` value is not stored in the database — it is only used at request time
- This is a minimal change consistent with Constitution principle V (Minimal & Composable)
