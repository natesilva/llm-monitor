# Implementation Plan: Bench Debug Flag

**Branch**: `004-bench-debug-flag` | **Date**: 2026-05-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-bench-debug-flag/spec.md`

## Summary

Add `--debug` and `--help` CLI flags to the bench runner. `--debug` prints the full request body and response body for each endpoint; `--help` prints usage information and exits. When neither flag is present, behavior is unchanged. Both flags are parsed via `util.parseArgs` with `Bun.argv` in the bench entry point; `debug` is threaded through to the endpoint runner.

## Technical Context

**Language/Version**: TypeScript (ESNext, strict, Bun runtime)
**Primary Dependencies**: Bun runtime, `util.parseArgs` + `Bun.argv` for CLI parsing
**Storage**: SQLite (unchanged — no schema changes)
**Testing**: `bun test`
**Target Platform**: macOS / Linux (Bun runtime)
**Project Type**: CLI bench runner + web dashboard (two-process architecture)
**Performance Goals**: Negligible — only adds console.log calls when flag is present
**Constraints**: Minimal changes — only bench runner files affected; no web/dashboard/cron changes
**Scale/Scope**: 3 files modified (index.ts, scheduler.ts, runner.ts)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Scheduled Benchmarking | ✅ PASS | Debug flag helps diagnose benchmark issues |
| V. Minimal & Composable | ✅ PASS | Single boolean parameter threaded through 3 files; no new dependencies, no new processes |
| IV. Persistent Metrics Store | ✅ PASS | No schema changes; debug output is console-only |

No violations. No complexity tracking needed.

## Project Structure

### Source Code (repository root)

```text
src/
└── bench/
    ├── index.ts       # MODIFY — parse --debug and --help flags via util.parseArgs(Bun.argv); if --help, print usage and exit; pass debug to runAllEndpoints
    ├── scheduler.ts   # MODIFY — accept debug param, pass to runEndpoint
    └── runner.ts      # MODIFY — accept debug param, print request/response when true
```

**Structure Decision**: No new files. Only existing bench files are modified.

## Complexity Tracking

No violations to justify. Table not needed.
