# Implementation Plan: Cache-Bust Request User

**Branch**: `002-cache-bust-user` | **Date**: 2026-05-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-cache-bust-user/spec.md`

## Summary

Add a unique, per-request `user` field to the benchmark runner's outgoing HTTP request body. The OpenAI chat completions API uses the `user` field as a cache key component, so varying it per request prevents servers from returning cached responses. The value is generated from a timestamp + random string — no configuration required.

## Technical Context

**Language/Version**: TypeScript (ESNext, strict, Bun runtime)
**Primary Dependencies**: Bun runtime, Bun.fetch(), crypto.randomUUID()
**Storage**: SQLite (unchanged — no schema changes)
**Testing**: `bun test`
**Target Platform**: macOS / Linux (Bun runtime)
**Project Type**: CLI bench runner + web dashboard (two-process architecture)
**Performance Goals**: Negligible — single `crypto.randomUUID()` call per request
**Constraints**: No database changes, no config changes, no dashboard changes; only the bench runner's request body is affected
**Scale/Scope**: Single file change (`src/bench/runner.ts`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Scheduled Benchmarking | ✅ PASS | Feature directly improves benchmark accuracy by preventing cached responses |
| III. OpenAI-API Compatible | ✅ PASS | `user` field is part of the OpenAI chat completions API spec |
| V. Minimal & Composable | ✅ PASS | Single-file change, no new dependencies, no new processes |
| IV. Persistent Metrics Store | ✅ PASS | No schema changes; `user` value is not stored (only used at request time) |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-cache-bust-user/
├── plan.md
├── research.md
├── quickstart.md
└── tasks.md             # Created by /speckit.tasks
```

### Source Code (repository root)

```text
src/
└── bench/
    └── runner.ts          # MODIFY — add `user` field to request body
```

**Structure Decision**: Single file modification. No new files, no structural changes.

## Complexity Tracking

No violations to justify. Table not needed.
