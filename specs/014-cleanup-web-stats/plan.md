# Implementation Plan: Clean Up Web UI Stats Display

**Branch**: `014-cleanup-web-stats` | **Date**: 2026-05-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-cleanup-web-stats/spec.md`

## Summary

Simplify the web dashboard by reducing per-configuration stat cards to three key metrics (Avg TPS, Avg TT100T, TPS StdDev) and switching the comparison graph from TPS to TT100T with a "lower is better" annotation. The current code already displays these three stats and uses TT100T in the comparison chart, so the primary work is confirming the existing implementation matches the spec and verifying edge cases are handled correctly.

## Technical Context

**Language/Version**: TypeScript (ESNext target), running on Bun runtime
**Primary Dependencies**: Bun runtime, Chart.js v4 (CDN), chartjs-adapter-date-fns@3
**Storage**: N/A (front-end only changes)
**Testing**: `bun test` (existing tests in `src/web/routes.test.ts`)
**Target Platform**: macOS/Linux (Bun runtime), browser-rendered dashboard
**Project Type**: Web service (front-end dashboard changes only)
**Performance Goals**: No degradation in dashboard render time
**Constraints**: Changes confined to `src/web/static/app.js` and `src/web/static/index.html`; no backend changes needed
**Scale/Scope**: 2 files modified; purely front-end UI adjustments

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Scheduled Benchmarking | PASS | No changes to benchmark runner or scheduling |
| II. Metrics Dashboard | PASS | Improving dashboard clarity by reducing stat clutter and switching comparison metric to TT100T |
| III. OpenAI-API Compatible | PASS | No API changes |
| IV. Persistent Metrics Store | PASS | No database or schema changes |
| V. Minimal & Composable | PASS | No new dependencies, no new processes |
| Code Quality | PASS | Formatter/linter must pass |
| Testing Requirements | PASS | Dashboard renders without JS errors given test data |
| Schema Migrations | PASS | No schema changes |

**Gate result**: PASS — no violations. This is a pure front-end display refinement.

## Project Structure

### Documentation (this feature)

```text
specs/014-cleanup-web-stats/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── spec.md
```

### Source Code (repository root)

```text
src/web/static/
├── app.js          # VERIFY: stat card rendering (lines 210-214), update logic (lines 324-332), comparison chart (lines 341-426)
└── index.html      # VERIFY: comparison-note element (line 321), CSS (lines 99-105), stat grid (lines 186-205)
```

**Structure Decision**: No structural changes needed. Changes are confined to existing files in `src/web/static/`.

## Complexity Tracking

> No violations — table not applicable.
