# Implementation Plan: Custom Bench Prompt

**Branch**: `005-custom-bench-prompt` | **Date**: 2026-05-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-custom-bench-prompt/spec.md`

## Summary

Add a `--prompt` CLI flag to the bench runner that overrides the prompt text sent to all endpoints. When the flag is absent, use a new default: "What is photosynthesis? Give a brief overview." (replacing the current "Hello, please respond with a short greeting."). The flag is parsed via the existing `util.parseArgs` + `Bun.argv` pattern and threaded through the scheduler to the runner, which substitutes the CLI prompt for the endpoint's `promptTemplate`.

## Technical Context

**Language/Version**: TypeScript (ESNext, strict, Bun runtime)
**Primary Dependencies**: Bun runtime, `util.parseArgs` + `Bun.argv` for CLI parsing (existing pattern from feature 004)
**Storage**: SQLite (unchanged — no schema changes)
**Testing**: `bun test`
**Target Platform**: macOS / Linux (Bun runtime)
**Project Type**: CLI bench runner + web dashboard (two-process architecture)
**Performance Goals**: Negligible — only changes which string is sent in the request body
**Constraints**: Minimal changes — only bench runner files and config defaults affected; no web/dashboard/cron changes
**Scale/Scope**: 3 files modified (index.ts, scheduler.ts, runner.ts) + 1 default value change (config.ts)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Scheduled Benchmarking | ✅ PASS | Custom prompt enables testing diverse scenarios; cron runs unaffected |
| III. OpenAI-API Compatible | ✅ PASS | Prompt templates are already configurable per-endpoint; CLI flag is a runtime override |
| V. Minimal & Composable | ✅ PASS | Single string parameter threaded through 3 files; no new dependencies, no new processes |
| IV. Persistent Metrics Store | ✅ PASS | No schema changes; prompt text is not stored in DB |

No violations. No complexity tracking needed.

## Project Structure

### Source Code (repository root)

```text
src/
├── bench/
│   ├── index.ts       # MODIFY — add --prompt to parseArgs options; thread prompt to runAllEndpoints
│   ├── scheduler.ts   # MODIFY — accept prompt param, pass to runEndpoint
│   └── runner.ts      # MODIFY — accept prompt param, use it to override endpoint.promptTemplate
└── shared/
    └── config.ts      # MODIFY — change DEFAULTS.promptTemplate to new default
```

**Structure Decision**: No new files. Only existing bench files + config default are modified.

## Complexity Tracking

No violations to justify. Table not needed.
