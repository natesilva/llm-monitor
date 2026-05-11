# Research: Modernize Promise Handling

**Date**: 2026-05-10
**Feature**: specs/011-modernize-promise-handling

## Decision 1: Top-level await in Bun ESM modules

**Decision**: Use top-level `await` at module entry points instead of `.catch()` chains.

**Rationale**: Bun supports top-level `await` in ESM modules (the project uses `"type": "module"` in package.json). The `.catch()` patterns at entry points (`src/bench/index.ts`, `src/bench/cron.ts`, `src/web/index.ts`) exist because traditional Node.js/CommonJS didn't support top-level await. Since this project is ESM on Bun, we can use `try { await ... } catch { ... }` directly at module scope.

**Alternatives considered**:
- IIFE wrapper (`(async () => { ... })()`) — unnecessary indirection when top-level await is available
- Keeping `.catch()` — violates the spec requirement to eliminate `.catch()`

## Decision 2: `return await` in async handler for serveFile

**Decision**: Change `return serveFile(...)` to `return await serveFile(...)` in the async route handler.

**Rationale**: The `serveFile` function returns `Promise<Response>`. The route handler is already `async`. Using `return await` ensures the handler's stack frame appears in error traces if `serveFile` rejects, rather than the rejection propagating directly to the caller with a missing intermediate frame.

**Alternatives considered**:
- Remove `async` from the handler and return the Promise directly — this would work for Bun's fetch handler (which accepts `Promise<Response>`), but it would mean the handler is not `async` and couldn't use `await` for other calls in the future. Also, it would not produce correct stack traces.
- Keep `return serveFile(...)` without `await` — defeats the purpose of this feature.

## Decision 3: Fire-and-forget patterns

**Decision**: No fire-and-forget patterns exist in the current codebase that should remain fire-and-forget. The `unregister()` call in `cron.ts` (line 122) and `main()` call in `web/index.ts` (line 49) are both entry-point calls that should have proper error handling. Both will be converted to `await` with `try/catch`.

**Rationale**: The `unregister()` call currently has zero error handling — any rejection is silently swallowed. The `main()` call in `web/index.ts` also has no error handling. Both are bugs, not intentional fire-and-forget patterns.

**Alternatives considered**:
- Use `void unregister()` with a comment — would suppress the un-awaited warning but still silently swallow errors, which is a bug at an entry point.
- Add `.catch()` — violates the spec requirement.

## Decision 4: cron-worker.ts scheduled() method

**Decision**: Make `scheduled` an `async` method and use `try/await/catch`.

**Rationale**: The `scheduled` method currently calls `runBench().catch(...)`. Converting to an `async` method with `try { await runBench() } catch { ... }` is the cleanest approach. Bun's `CronController` callback doesn't care about the return value, so making it async has no behavioral impact.

**Alternatives considered**:
- Keep `.catch()` — violates spec.
- Use `void await runBench()` — invalid syntax.

## Findings Summary

| Pattern | Count | Files Affected |
|---------|-------|----------------|
| `.catch()` on Promises | 4 | index.ts, cron.ts (x2), cron-worker.ts |
| Un-awaited async calls | 2 | cron.ts, web/index.ts |
| `return <promise>` without `await` | 2 | routes.ts (x2) |
| **Total call sites** | **8** | **4 files** |

No `.then()` or `.finally()` patterns were found in the codebase. No new dependencies are needed. No data model or interface changes are required.
