# Implementation Plan: Modernize Promise Handling

**Branch**: `011-modernize-promise-handling` | **Date**: 2026-05-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-modernize-promise-handling/spec.md`

## Summary

Replace all `.catch()` chains, un-awaited Promise calls, and un-awaited `return` of Promises with `async/await` patterns (including `return await`). Four source files require changes across 9 specific call sites. No data model or interface changes.

## Technical Context

**Language/Version**: TypeScript (ESNext target), running on Bun runtime
**Primary Dependencies**: Bun runtime, bun:sqlite, node:fs, node:path, dotenv, chart.js
**Storage**: SQLite via bun:sqlite (no changes needed)
**Testing**: `bun test` (existing tests in `src/bench/cron-worker.test.ts` and `src/web/routes.test.ts`)
**Target Platform**: macOS/Linux (Bun runtime)
**Project Type**: CLI/web-service (two-process: bench runner + web dashboard)
**Performance Goals**: N/A (refactoring only, no performance change expected)
**Constraints**: No functional regressions; all existing tests must pass
**Scale/Scope**: 4 files, 9 call sites to modify

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Scheduled Benchmarking | PASS | No change to benchmark logic; only Promise handling syntax |
| II. Metrics Dashboard | PASS | No change to dashboard behavior; `return await` preserves response semantics |
| III. OpenAI-API Compatible | PASS | No endpoint or API changes |
| IV. Persistent Metrics Store | PASS | No schema or query changes |
| V. Minimal & Composable | PASS | No new processes, packages, or shared runtime; pure refactoring |
| Code Quality | PASS | Changes are formatting-level refactors; linter must still pass |
| Testing Requirements | PASS | All existing tests must pass unchanged |

**Gate result**: PASS — no violations. This is a pure refactoring with no new complexity.

## Project Structure

### Documentation (this feature)

```text
specs/011-modernize-promise-handling/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A — no data changes)
├── quickstart.md        # Phase 1 output
└── spec.md              # Feature specification
```

### Source Code (repository root)

```text
src/
├── bench/
│   ├── index.ts          # MODIFY: main().catch() → try/await/catch
│   ├── cron.ts           # MODIFY: register().catch(), unregister(), status().catch()
│   ├── cron-worker.ts    # MODIFY: runBench().catch() → try/await/catch in async method
│   └── ...               # (scheduler.ts, runner.ts, config.ts — no changes)
├── web/
│   ├── index.ts          # MODIFY: main() → await main()
│   ├── routes.ts         # MODIFY: return serveFile() → return await serveFile()
│   └── ...
├── db/                   # (no changes)
└── shared/               # (no changes)
```

**Structure Decision**: Single project layout unchanged. Only 4 files in `src/bench/` and `src/web/` need modification.

## Complexity Tracking

> No violations — table not applicable.

## Change Inventory

| # | File | Line | Current Pattern | Target Pattern |
|---|------|------|----------------|----------------|
| 1 | `src/bench/index.ts` | 59 | `main().catch(...)` | `try { await main() } catch { ... }` |
| 2 | `src/bench/cron.ts` | 116 | `register().catch(...)` | `try { await register() } catch { ... }` |
| 3 | `src/bench/cron.ts` | 122 | `unregister()` (no await, no catch) | `try { await unregister() } catch { ... }` |
| 4 | `src/bench/cron.ts` | 125 | `status().catch(...)` | `try { await status() } catch { ... }` |
| 5 | `src/bench/cron-worker.ts` | 14 | `runBench().catch(...)` | `try { await runBench() } catch { ... }` in `async scheduled()` |
| 6 | `src/web/index.ts` | 49 | `main()` (no await, no catch) | `await main()` with top-level try/catch |
| 7 | `src/web/routes.ts` | 63 | `return serveFile(...)` | `return await serveFile(...)` |
| 8 | `src/web/routes.ts` | 69 | `return serveFile(...)` | `return await serveFile(...)` |

## Verification

1. `bun test` — all existing tests pass
2. `bunx biome check src/` — linter passes
3. `bunx tsc --noEmit` — typecheck passes
4. Manual search: `grep -r '\.then(\|\.catch(' src/` returns zero hits on Promise patterns
5. Manual search: no un-awaited async function calls remain (except annotated fire-and-forget with `void`)
