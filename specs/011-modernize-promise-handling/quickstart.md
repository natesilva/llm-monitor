# Quickstart: Modernize Promise Handling

**Date**: 2026-05-10
**Feature**: specs/011-modernize-promise-handling

## Prerequisites

- Bun runtime installed
- Project dependencies installed (`bun install`)

## Changes at a Glance

4 files, 8 call sites:

| File | Change |
|------|--------|
| `src/bench/index.ts` | `main().catch(...)` → `try { await main() } catch { ... }` |
| `src/bench/cron.ts` | 3 call sites: `.catch()` and un-awaited `unregister()` → `try/await/catch` |
| `src/bench/cron-worker.ts` | `runBench().catch(...)` → `async scheduled()` with `try/await/catch` |
| `src/web/index.ts` | `main()` → `await main()` with top-level `try/catch` |
| `src/web/routes.ts` | `return serveFile(...)` → `return await serveFile(...)` (2 sites) |

## Verification

```bash
# Run tests
bun test

# Lint
bunx biome check src/

# Typecheck
bunx tsc --noEmit

# Verify no .then/.catch on Promises remain
grep -rn '\.catch(' src/ --include='*.ts'
# Expected: zero hits
```
