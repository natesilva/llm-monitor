# Implementation Plan: LLM Performance Dashboard

**Branch**: `main` | **Date**: 2026-05-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-performance-dashboard/spec.md`

## Summary

Build an LLM performance monitor with two components: a benchmark runner
invoked by an OS-level cron job (registered via `Bun.cron()`) that tests
OpenAI-compatible endpoints and captures TPS/latency metrics, and a web
dashboard that displays per-configuration performance tiles (48h TPS graphs +
stats) plus a cross-configuration comparison graph (24h, selectable).
Use Bun runtime with ESM, leveraging built-in APIs (Bun.cron() for OS-level
scheduling, Bun.sqlite() for database, Bun.serve() for HTTP server, fetch()
for API calls) instead of external libraries.

## Technical Context

**Language/Version**: TypeScript (latest stable) with Bun runtime (latest),
ESM modules throughout

**Primary Dependencies**: Bun built-in APIs only — `Bun.cron()` for OS-level
scheduled job registration, `Bun.sqlite()` for database, `Bun.serve()` for
HTTP server, `fetch()` for API calls. Minimal external deps only if Bun
built-ins insufficient (e.g., Chart.js for the web dashboard).

**Storage**: Bun.sqlite (built-in SQLite via `Database` API), single file per
deployment

**Testing**: Bun test (built-in), with `bun:test` for unit/integration tests,
`mock` for HTTP endpoint mocking

**Target Platform**: macOS (development), Linux (deployment) — wherever Bun
runs. OS-level cron support requires the host OS to support cron/launchd.

**Project Type**: Two components: one-shot benchmark runner (invoked by
OS-level cron) + long-running HTTP web server, single Bun package

**Performance Goals**: <500ms overhead per benchmark run (excluding network);
dashboard full render <3s with 7 days of data across 10 configurations at 1h
intervals

**Constraints**: Must use `Bun.cron()` for OS-level scheduling (no long-
running daemon process, no node-cron or similar); no external runtime daemons
or databases; all configuration via environment variables and/or config file

**Scale/Scope**: Single local user; 10–50 provider/model configurations;
data retention up to 30 days by default

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| I. Scheduled Benchmarking | ✅ PASS | `Bun.cron()` registers OS-level scheduled job; `fetch()` for endpoint calls |
| II. Metrics Dashboard | ✅ PASS | `Bun.serve()` for HTTP; Chart.js for graphs |
| III. OpenAI-API Compatible | ✅ PASS | Standard `fetch()` with /v1/chat/completions payloads |
| IV. Persistent Metrics Store | ✅ PASS | `Bun.sqlite()` for embedded SQLite storage |
| V. Minimal & Composable | ✅ PASS | Two components: one-shot runner + long-running web server, sharing only the SQLite DB file |
| Architecture & Deployment | ✅ PASS | OS-level cron invokes bench; web server is long-running |
| Development Workflow | ✅ PASS | Bun test, formatting via `bun fmt` |

**Gate decision (pre-Phase 0)**: ✅ All gates pass.

**Post-Phase 1 re-evaluation**: ✅ All gates still pass. Architecture updated
to use `Bun.cron()` for OS-level scheduling (no long-running bench daemon).
- Bun.cron() ✓ | Bun.sqlite() ✓ | Bun.serve() ✓ | fetch() ✓ | Bun test ✓
- One-shot bench runner + long-running web server ✓
- No external dependencies beyond Chart.js for client-side rendering ✓

## Project Structure

### Documentation (this feature)

```text
specs/001-performance-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
├── checklists/
│   └── requirements.md
└── spec.md
```

### Source Code (repository root)

```text
src/
├── bench/                  # llm-monitor-bench (one-shot runner)
│   ├── index.ts            # Entry point: run all endpoints, then exit
│   ├── runner.ts           # Execute prompt against a single endpoint
│   └── config.ts           # Config loading for bench process
├── web/                    # llm-monitor-web (long-running HTTP server)
│   ├── index.ts            # Entry point: start HTTP server via Bun.serve()
│   ├── routes.ts           # Route handlers
│   ├── tiles.ts            # Per-configuration tile data
│   └── comparison.ts       # Cross-config comparison graph data
├── db/                     # Shared database layer
│   ├── schema.ts           # Table definitions and migrations
│   ├── migrations/         # Versioned migration SQL files
│   └── queries.ts          # Database query functions
└── shared/                 # Shared between both components
    ├── types.ts            # TypeScript types (Config, BenchmarkRun, etc.)
    └── config.ts           # Shared config schema and loading

tests/
├── bench/
│   └── runner.test.ts
├── web/
│   └── routes.test.ts
├── db/
│   ├── schema.test.ts
│   └── queries.test.ts
└── integration/
    └── e2e.test.ts
```

**Structure Decision**: Single-package monorepo. Both components live under
`src/` with clear sub-directories. The bench component is a one-shot script
(`bun run src/bench/index.ts`) invoked by OS-level cron. The web component is
a long-running server (`bun run src/web/index.ts`). Shared types and config in
`src/shared/`. Database layer in `src/db/` used by both components. Tests
mirror production layout.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. The two-component architecture (one-shot runner + web server)
is explicitly required by Constitution Principle V (Minimal & Composable).
OS-level cron replaces the long-running daemon approach for simplicity.
