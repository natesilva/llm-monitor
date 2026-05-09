# Implementation Plan: Web UI Quality-of-Life Improvements

**Branch**: `009-web-ui-qol` | **Date**: 2026-05-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-web-ui-qol/spec.md`

## Summary

Add light/auto/dark display mode toggle to the dashboard (currently dark-only) and a data detail overlay to each configuration tile showing a table of recent data points. Minimal changes: CSS custom properties for theming, a mode toggle UI, a modal/overlay component, and a new API endpoint for fetching raw data points.

## Technical Context

**Language/Version**: TypeScript with Bun runtime (Bun 1.3+)
**Primary Dependencies**: Bun (server + sqlite), Chart.js 4 (CDN), date-fns + chartjs-adapter-date-fns (CDN)
**Storage**: SQLite via `bun:sqlite` (existing `benchmark_runs` table)
**Testing**: `bun:test` (existing pattern in `src/web/routes.test.ts`)
**Target Platform**: Web dashboard served by Bun HTTP server, rendered in modern browsers
**Project Type**: Web service (server-rendered HTML + client-side JS, no framework)
**Performance Goals**: Instant theme switch, overlay open/close < 2s
**Constraints**: No build step for frontend — plain HTML/CSS/JS served statically; no npm frontend tooling
**Scale/Scope**: Single-page dashboard, ~5-10 configuration tiles

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Scheduled Benchmarking | PASS | No changes to benchmark runner |
| II. Metrics Dashboard | PASS | Enhancing dashboard with theme + data overlay |
| III. OpenAI-API Compatible | PASS | No endpoint changes |
| IV. Persistent Metrics Store | PASS | Reusing existing `benchmark_runs` table; new read-only query |
| V. Minimal & Composable | PASS | Frontend-only changes (CSS + JS) plus one new read-only API route; no new processes, no new deps |

**Gate**: PASS — all principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/009-web-ui-qol/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
├── db/
│   ├── migrations/
│   │   └── 0001_initial.sql       # unchanged
│   ├── queries.ts                  # add getDataPointsForConfig()
│   └── schema.ts                   # unchanged
├── web/
│   ├── static/
│   │   ├── index.html              # add theme CSS vars, mode toggle, overlay markup
│   │   └── app.js                  # add theme logic, overlay logic, data fetching
│   ├── index.ts                    # unchanged
│   └── routes.ts                   # add GET /api/metrics/data-points route
└── shared/
    └── types.ts                    # add DataPointsResponse type
```

**Structure Decision**: Existing single-project layout preserved. All changes are local to `src/web/` and `src/db/queries.ts`.

## Complexity Tracking

No constitution violations to justify.
