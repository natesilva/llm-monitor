# Implementation Plan: Add TT100T Metric

**Branch**: `013-add-tt100t-metric` | **Date**: 2026-05-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-add-tt100t-metric/spec.md`

## Summary

Add a "time to first 100 tokens" (TT100T) metric that captures the wall-clock time from request initiation to the point 100 completion tokens have been generated. This composite metric reflects the real-world responsiveness a user experiences in interactive settings, combining both prefill latency and early generation speed. The runner already tracks per-chunk timing and cumulative token counts, so TT100T is computed during the existing streaming loop by recording `performance.now()` when cumulative tokens reach 100.

## Technical Context

**Language/Version**: TypeScript (ESNext target), running on Bun runtime
**Primary Dependencies**: Bun runtime, bun:sqlite, chart.js, dotenv, openai, js-tiktoken (existing)
**Storage**: SQLite via bun:sqlite (schema migration required: add `tt100t_ms` column)
**Testing**: `bun test` (existing tests in `src/web/routes.test.ts`, `src/bench/runner.test.ts`)
**Target Platform**: macOS/Linux (Bun runtime)
**Project Type**: CLI/web-service (two-process: bench runner + web dashboard)
**Performance Goals**: No degradation in benchmark cycle time
**Constraints**: Must handle nullable TT100T (null when <100 tokens or non-streaming); backward-compatible with existing data
**Scale/Scope**: 1 migration, 5+ files modified; builds on existing TTFT infrastructure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Scheduled Benchmarking | PASS | Extending captured metrics (TT100T alongside TTFT/TPS) |
| II. Metrics Dashboard | PASS | Adding TT100T to dashboard tiles and data overlay |
| III. OpenAI-API Compatible | PASS | No API changes; TT100T measured from existing streaming chunks |
| IV. Persistent Metrics Store | PASS | New `tt100t_ms` column via migration; nullable for backward compat |
| V. Minimal & Composable | PASS | No new dependencies; no new processes; extends existing runner |
| Code Quality | PASS | Formatter/linter must pass |
| Testing Requirements | PASS | Unit tests for TT100T calculation; existing tests updated |
| Schema Migrations | PASS | New idempotent migration script |

**Gate result**: PASS — no violations. This is a straightforward extension of the existing streaming metrics infrastructure.

## Project Structure

### Documentation (this feature)

```text
specs/013-add-tt100t-metric/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── spec.md
```

### Source Code (repository root)

```text
src/
├── bench/
│   └── runner.ts          # MODIFY: track cumulative tokens per chunk, record TT100T timestamp
├── db/
│   ├── migrations/
│   │   └── 0003_add_tt100t.sql  # NEW: ALTER TABLE benchmark_runs ADD COLUMN tt100t_ms INTEGER
│   └── queries.ts          # MODIFY: include tt100t_ms in INSERT/SELECT; add avgTt100tMs to computeStats
├── shared/
│   └── types.ts            # MODIFY: add tt100tMs to BenchmarkRun, MetricsDataPoint; add avgTt100tMs to ConfigStats
└── web/
    ├── routes.test.ts      # MODIFY: update seed data to include tt100tMs
    └── static/
        ├── app.js          # MODIFY: add TT100T to tile stats and overlay table
        └── index.html       # MODIFY: add TT100T column header to overlay table
```

**Structure Decision**: Single project layout unchanged. Extends existing streaming metrics in runner.ts.

## Complexity Tracking

> No violations — table not applicable.
