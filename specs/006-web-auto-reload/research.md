# Research: Web Auto-Reload

**Date**: 2026-05-08
**Feature**: Add auto-reload for web server on source file changes

## Decision 1: Auto-Reload Mechanism

**Decision**: Use `bun --hot src/web/index.ts` via a `web:dev` npm script.

**Rationale**:
- User explicitly requested `bun --hot`
- `bun --hot` is a built-in Bun feature — watches imported files and hot-reloads the process on changes
- Zero code required — no custom file watcher, no debounce logic, no error recovery code
- Bun handles debouncing, error recovery, and process lifecycle natively
- The `--hot` flag only watches files that the process imports, which is exactly `src/` by construction

**Alternatives considered**:
- `Bun.fileSystemWatcher` + manual process restart: Would require ~50 lines of watcher code, debounce logic, and error handling — all unnecessary when `--hot` does this natively
- `nodemon`: External dependency; not Bun-idiomatic
- `bun --watch`: Similar to `--hot` but performs full process restart; `--hot` does hot module replacement which is faster. User specified `--hot`

## Decision 2: How to Expose Development Mode

**Decision**: Add a `web:dev` script to `package.json` that runs `bun --hot src/web/index.ts`. The existing `web` script remains `bun run src/web/index.ts` (no hot reload).

**Rationale**:
- Keeps the default `bun run web` production-safe (no file watching, no auto-restart)
- `web:dev` is a conventional naming pattern (cf. `next dev`, `vite dev`)
- Also add a `web-dev` Makefile target for Makefile users

**Alternatives considered**:
- `--dev` flag on the web server itself: Requires parsing args in source code, adding conditional watcher logic — `--hot` makes this unnecessary
- Environment variable `DEV=1 bun run web`: Less discoverable than a named script
