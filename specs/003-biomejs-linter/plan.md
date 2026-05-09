# Implementation Plan: Add Project Linter (BiomeJS)

**Branch**: `003-biomejs-linter` | **Date**: 2026-05-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-biomejs-linter/spec.md`

## Summary

Add BiomeJS as a unified linter/formatter to replace the current Prettier-only setup. Biome provides both linting and formatting in a single tool, consistent with the project's Minimal & Composable principle (V). The change is minimal: install the dependency, add a config file, replace Prettier commands with Biome equivalents in package.json and Makefile, and ensure existing code passes.

## Technical Context

**Language/Version**: TypeScript (ESNext, strict mode)
**Primary Dependencies**: Bun runtime, Chart.js (browser CDN), BiomeJS (new dev dep)
**Storage**: SQLite via Bun.sqlite()
**Testing**: `bun test`
**Target Platform**: macOS / Linux (Bun runtime)
**Project Type**: Web service + CLI bench runner (two-process architecture)
**Performance Goals**: Lint/format runs in <10s for this project size
**Constraints**: Minimal changes — replace Prettier, add Biome, no other tooling changes
**Scale/Scope**: ~12 TypeScript files, 1 JS file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| V. Minimal & Composable | ✅ PASS | Replacing 2 tools (Prettier + manual lint) with 1 (Biome) reduces complexity |
| Dev Workflow: Code Quality | ✅ PASS | Constitution requires "Linting MUST pass before merge" — this feature directly enables that gate |
| Dev Workflow: Formatter | ✅ PASS | Constitution requires "formatted with the project's configured formatter" — Biome replaces Prettier as the formatter |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/003-biomejs-linter/
├── plan.md
├── research.md
├── quickstart.md
└── tasks.md             # Created by /speckit.tasks
```

### Source Code (repository root)

No new source files. Changes to existing files only:

```text
.                           # Project root
├── biome.json              # NEW — Biome configuration
├── package.json            # MODIFY — add @biomejs/biome, replace fmt/lint scripts
├── Makefile                # MODIFY — replace fmt target, add lint target
└── src/                    # MODIFY — fix any lint errors found by Biome
```

**Structure Decision**: No structural changes. Biome is a dev-only tool addition that integrates into existing toolchain.

## Complexity Tracking

No violations to justify. Table not needed.
