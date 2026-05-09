# Implementation Plan: Cron Job Registration & Unregistration

**Branch**: `007-cron-job-management` | **Date**: 2026-05-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-cron-job-management/spec.md`

## Summary

Provide simple CLI commands to register, unregister, and check the status of the OS-level cron job that runs scheduled benchmarks. Replaces the existing `bench:setup` script with a unified `cron` command supporting `register`, `unregister`, and `status` subcommands.

## Technical Context

**Language/Version**: TypeScript (Bun runtime, v1.3.13)
**Primary Dependencies**: Bun (native `Bun.cron()` API for OS-level cron management)
**Storage**: N/A (OS scheduler is the source of truth — launchd on macOS, crontab on Linux)
**Testing**: `bun test` with existing test patterns (unit tests + source-code inspection tests)
**Target Platform**: macOS (primary, launchd) and Linux (secondary, crontab)
**Project Type**: CLI tool (subcommands for cron job lifecycle management)
**Performance Goals**: All commands complete in under 5 seconds
**Constraints**: No new persistent storage; OS scheduler is source of truth
**Scale/Scope**: Single user, single project, single cron job

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Scheduled Benchmarking | ✅ Compliant | Feature directly supports this principle by making cron registration easy |
| II. Metrics Dashboard | ✅ Compliant | No impact on dashboard |
| III. OpenAI-API Compatible | ✅ Compliant | No impact on API compatibility |
| IV. Persistent Metrics Store | ✅ Compliant | No new database tables needed |
| V. Minimal & Composable | ✅ Compliant | Single new CLI entry point with subcommands; no new processes or shared runtime; bench runner remains one-shot |

**Post-design re-evaluation**: See below.

## Project Structure

### Documentation (this feature)

```text
specs/007-cron-job-management/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── cli.md
└── spec.md
```

### Source Code (repository root)

```text
src/
├── bench/
│   ├── cron.ts              # NEW: Unified CLI entry point (register/unregister/status)
│   ├── cron-worker.ts       # UNCHANGED: Existing cron worker
│   ├── cron-worker.test.ts  # UNCHANGED: Existing cron worker tests
│   ├── index.ts             # UNCHANGED: Existing bench runner
│   ├── runner.ts            # UNCHANGED
│   ├── scheduler.ts         # UNCHANGED
│   ├── setup-cron.ts        # REMOVE: Replaced by cron.ts
│   ├── setup-cron.test.ts   # REMOVE: Replaced by cron.test.ts
│   └── config.ts            # UNCHANGED
├── db/                       # UNCHANGED
├── shared/
│   ├── config.ts            # UNCHANGED
│   └── types.ts             # UNCHANGED (CronJob constant may be added here)
└── web/                      # UNCHANGED

tests/                        # No separate tests/ directory (tests co-located)

package.json                  # UPDATE: Replace bench:setup with cron script
Makefile                      # UPDATE: Replace bench-setup with cron targets
```

**Structure Decision**: Single project with co-located tests. New `cron.ts` replaces `setup-cron.ts`. The shared `CRON_JOB_NAME` constant is defined in `src/bench/cron.ts` since it's only used there.

## Complexity Tracking

No violations — no entries needed.
