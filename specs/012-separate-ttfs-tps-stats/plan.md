# Implementation Plan: Separate TTFT and TPS Stats

**Branch**: `012-separate-ttfs-tps-stats` | **Date**: 2026-05-11 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/012-separate-ttfs-tps-stats/spec.md`

## Summary

The benchmark runner currently measures total wall-clock latency and derives TPS as `completion_tokens / total_seconds`, conflating time-to-first-token (TTFT) with streaming throughput. This feature switches the runner to use streaming SSE for capable endpoints, records TTFT as the elapsed time to the first content chunk, and recomputes TPS from the inter-token interval (first chunk → last chunk). Non-streaming endpoints retain existing behavior with null TTFT. A SQL migration adds a nullable `ttft_ms` column. The dashboard exposes TTFT P50/P95 in stat tiles and N/A display in data tables.

## Technical Context

**Language/Version**: TypeScript (Bun runtime, native TS support)  
**Primary Dependencies**: Bun built-in `fetch` with Web Streams API, Bun SQLite, Chart.js (frontend only)  
**Storage**: SQLite embedded database (via Bun's `bun:sqlite`)  
**Testing**: Bun test runner (`bun test`)  
**Target Platform**: macOS/Linux local server  
**Project Type**: CLI tool + web service (two independent processes)  
**Performance Goals**: Streaming benchmark adds negligible overhead; web dashboard API responses remain under 200ms  
**Constraints**: Streaming requires SSE parsing (no npm package needed — Bun's `ReadableStream` handles it natively). Must not break non-streaming endpoints. Schema migration must be idempotent (SQLite `ALTER TABLE ADD COLUMN` only).  
**Scale/Scope**: Single user, local deployment, same data volumes as current system

## Constitution Check

| Principle | Touched | Assessment |
|-----------|---------|------------|
| I – Scheduled Benchmarking | Yes — runner changes measurement strategy | Compliant: captures TTFT and streaming-accurate TPS in addition to existing metrics |
| II – Metrics Dashboard | Yes — dashboard adds TTFT stat tiles | Compliant: expands metric coverage, no auth changes |
| III – OpenAI-API Compatible | Yes — adds `stream: true` to requests | Compliant: streaming is part of the OpenAI chat completions spec; fallback preserves non-streaming compatibility |
| IV – Persistent Metrics Store | Yes — schema change | **GATE**: Migration script required (`0002_add_ttft.sql`). Must be idempotent. `tps` column semantics preserved (best-available throughput). |
| V – Minimal & Composable | No new processes or dependencies | Compliant: Bun's native fetch/ReadableStream handles SSE; no new packages |

**Testing Requirements Compliance**:
- Unit tests: `computeStats` updated; new streaming timing logic needs unit tests
- Integration test: mock SSE endpoint needed to test TTFT measurement
- Web dashboard: must continue rendering without JS errors

**Gate evaluation**: All gates pass. Migration script must be written and must be idempotent.

## Project Structure

### Documentation (this feature)

```text
specs/012-separate-ttfs-tps-stats/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── contracts/
│   └── web-api.md       ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code (modified files)

```text
src/
├── bench/
│   └── runner.ts                  ← switch to streaming SSE, measure TTFT
├── db/
│   ├── migrations/
│   │   ├── 0001_initial.sql       ← unchanged
│   │   └── 0002_add_ttft.sql      ← NEW: ADD COLUMN ttft_ms REAL
│   ├── queries.ts                 ← insertRun gains ttft_ms; computeStats gains P50/P95 TTFT
│   └── schema.ts                  ← apply new migration at startup
├── shared/
│   └── types.ts                   ← EndpointConfig.streaming, BenchmarkRun.timeToFirstTokenMs,
│                                     MetricsDataPoint.ttftMs, ConfigStats p50/p95TtftMs
└── web/
    ├── routes.ts                  ← pass ttft_ms through query results to API responses
    └── static/
        └── app.js                 ← display TTFT P50/P95 in stat tiles; N/A in data table
```

**Structure Decision**: Single project layout retained. All changes are within the existing `src/` tree. No new top-level directories.

## Complexity Tracking

No constitution violations requiring justification.
