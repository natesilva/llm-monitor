# Implementation Plan: Web Auto-Reload

**Branch**: `006-web-auto-reload` | **Date**: 2026-05-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-web-auto-reload/spec.md`

## Summary

Add a `web:dev` npm script that runs the web server with `bun --hot`, which provides built-in file watching and automatic restart on source changes. The default `web` script remains unchanged (no auto-reload). No new source code files needed — this is a `package.json` script addition only.

## Technical Context

**Language/Version**: TypeScript (ESNext, strict, Bun runtime)
**Primary Dependencies**: Bun `--hot` flag (built-in, no external deps)
**Storage**: N/A — no data changes
**Testing**: Manual verification (`bun run web:dev`, edit a file, verify restart)
**Target Platform**: macOS / Linux (Bun runtime)
**Project Type**: CLI bench runner + web dashboard (two-process architecture)
**Performance Goals**: Restart within ~1 second of file change (Bun `--hot` handles this natively)
**Constraints**: No source code changes to web server; only `package.json` and `Makefile` script additions
**Scale/Scope**: 2 files modified (package.json, Makefile)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| V. Minimal & Composable | ✅ PASS | No new code; leverages Bun built-in feature |
| II. Metrics Dashboard | ✅ PASS | Auto-reload improves developer productivity on the dashboard |

No violations. No complexity tracking needed.

## Project Structure

### Source Code (repository root)

```text
package.json    # MODIFY — add "web:dev" script with bun --hot
Makefile        # MODIFY — add web-dev target
```

**Structure Decision**: No new source files. Only script entries are added.

## Complexity Tracking

No violations to justify. Table not needed.
