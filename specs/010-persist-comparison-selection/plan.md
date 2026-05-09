# Implementation Plan: Persist Comparison Graph Selection

**Branch**: `010-persist-comparison-selection` | **Date**: 2026-05-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/010-persist-comparison-selection/spec.md`

## Summary

Persist the Comparison graph's active configuration selection to `localStorage` so it survives page reloads. Follow the existing theme persistence pattern (`localStorage` key + restore on init). Changes are limited to `app.js` — no server-side changes needed.

## Technical Context

**Language/Version**: TypeScript (ESNext, strict, Bun runtime); vanilla JS for frontend
**Primary Dependencies**: Bun, Chart.js (CDN), browser localStorage API
**Storage**: Browser localStorage (client-side only; no server changes)
**Testing**: `bun test` for route tests; manual browser verification for UI behavior
**Target Platform**: macOS / Linux (Bun runtime); any modern browser for frontend
**Project Type**: CLI bench runner + web dashboard (two-process architecture)
**Performance Goals**: Zero perceptible delay — localStorage read/write is synchronous and sub-millisecond
**Constraints**: No new dependencies; no server-side changes; follow existing localStorage pattern used by theme toggle
**Scale/Scope**: 1 file modified (`src/web/static/app.js`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| V. Minimal & Composable | ✅ PASS | Client-side only change; no new processes, no shared state, no server changes |
| II. Metrics Dashboard | ✅ PASS | Improves dashboard UX by preserving user preferences |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/010-persist-comparison-selection/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/            # Phase 1 output (not needed — no API changes)
```

### Source Code (repository root)

```text
src/web/static/app.js    # MODIFY — add localStorage save/restore for activeConfigs
```

**Structure Decision**: Single-file change. No new files, no server changes. The feature is entirely client-side.
