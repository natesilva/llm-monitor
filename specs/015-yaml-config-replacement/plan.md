# Implementation Plan: Replace config.ts with YAML Configuration

**Branch**: `015-yaml-config-replacement` | **Date**: 2026-05-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-yaml-config-replacement/spec.md`

## Summary

Replace the executable TypeScript configuration file (`config.ts`) with a declarative YAML configuration file (`config.yaml`), using Bun's built-in `Bun.YAML.parse()` API. The existing `loadConfig()` and `validateConfig()` logic is preserved but adapted to read from a YAML file instead of a dynamically-imported `.ts` file. API keys continue to be resolved from environment variables referenced by name in the YAML file.

## Technical Context

**Language/Version**: TypeScript with Bun runtime (Bun ^1.3)
**Primary Dependencies**: Bun built-in YAML support (`Bun.YAML.parse()`), no new external dependencies
**Storage**: SQLite (unchanged)
**Testing**: `bun:test` (existing test framework)
**Target Platform**: macOS / Linux (Bun runtime)
**Project Type**: CLI tool + web service (two processes)
**Performance Goals**: N/A (config loading is startup-only)
**Constraints**: No external YAML dependencies; use Bun's built-in support only
**Scale/Scope**: Single YAML file, ~3 entry points to update, ~10 source files affected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Scheduled Benchmarking | ✅ Pass | YAML provides `bench.schedule` and `bench.endpoints` |
| II. Metrics Dashboard | ✅ Pass | Unaffected |
| III. OpenAI-API Compatible | ✅ Pass | Endpoint config externalized in YAML |
| IV. Persistent Metrics Store | ✅ Pass | Unaffected |
| V. Minimal & Composable | ✅ Pass | No new processes, no external deps, shared config module |
| Architecture > Configuration | ⚠️ Amendment needed | Current: "env vars with `.env`" → New: "YAML file with env vars for secrets" |
| Dev > Code Quality | ✅ Pass | No secrets in YAML (referenced by env var name) |
| Dev > Testing | ✅ Pass | Existing test helpers work; add YAML-specific tests |
| Dev > Schema Migrations | ✅ Pass | No schema changes |

### Constitution Amendment Required

The **Architecture & Deployment > Configuration** section currently states:
> "Configuration MUST be via environment variables with a `.env` file as default."

This must be updated to:
> "Configuration MUST be via a YAML configuration file. Sensitive values (API keys) MUST be referenced by environment variable name in the YAML file and resolved at runtime. A `.env` file may be used to set those environment variables during development."

This is a **MINOR** version bump (v1.1.0 → v1.2.0) per the amendment procedure.

## Project Structure

### Documentation (this feature)

```text
specs/015-yaml-config-replacement/
├── plan.md              # This file
├── research.md          # Phase 0: technology decisions
├── data-model.md        # Phase 1: YAML structure and validation rules
├── quickstart.md        # Phase 1: setup guide for YAML config
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
config.example.yaml      # NEW: example YAML config (replaces config.example.ts)
config.example.ts        # DELETE: old TypeScript example config
.env.example             # UPDATE: reference YAML config instead of config.jsonc
src/
├── shared/
│   ├── config.ts        # REWRITE: loadConfigFromYaml() replaces loadConfig(raw)
│   └── types.ts         # UNCHANGED: AppConfig, EndpointConfig types retained
├── bench/
│   ├── index.ts         # UPDATE: use loadConfigFromYaml() instead of dynamic import
│   ├── cron.ts          # UPDATE: use loadConfigFromYaml() instead of dynamic import
│   └── config.ts        # UNCHANGED: loadEndpoints() still calls resolveApiKeys()
├── web/
│   ├── index.ts         # UPDATE: use loadConfigFromYaml() instead of dynamic import
│   └── routes.test.ts   # UNCHANGED: makeConfig() helper creates AppConfig directly
.gitignore               # UPDATE: add config.yaml, remove /config.ts
tsconfig.json            # UPDATE: remove config.example.ts from include
.specify/memory/
│   └── constitution.md  # UPDATE: amend Configuration section (v1.1.0 → v1.2.0)
```

**Structure Decision**: No structural changes — this is a targeted replacement of the config loading mechanism within the existing project layout.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Constitution amendment | YAML replaces env-vars-as-primary-config | Keeping current wording would be factually incorrect post-change |

## Implementation Steps

### Step 1: Create `config.example.yaml`

New file at project root. Mirrors `config.example.ts` content in YAML format with inline comments documenting each field and its default.

### Step 2: Rewrite `src/shared/config.ts`

Replace `loadConfig(raw: AppConfig)` with `loadConfigFromYaml()`:
- Read file from `CONFIG_PATH` env var or default `config.yaml`
- Parse with `Bun.YAML.parse()`
- Apply defaults (same `normalizeEndpoint()` logic)
- Validate (same `validateConfig()` logic)
- Return `AppConfig`

Keep `resolveApiKeys()` unchanged.

### Step 3: Update entry points

Three files replace the dynamic `import("../../config.ts")` pattern with `loadConfigFromYaml()`:
- `src/bench/index.ts`
- `src/bench/cron.ts`
- `src/web/index.ts`

### Step 4: Update `.env.example`

Change comment from "config.jsonc" to "config.yaml".

### Step 5: Update `.gitignore`

- Add `config.yaml` (user's actual config, like the current `config.ts` entry)
- Remove `/config.ts` entry

### Step 6: Delete `config.example.ts`

No longer needed — replaced by `config.example.yaml`.

### Step 7: Update `tsconfig.json`

Remove `config.example.ts` from the `include` array.

### Step 8: Switch `web:dev` to `--hot`

In `package.json`, change the `web:dev` script from `bun --watch src/web/index.ts` to `bun --hot src/web/index.ts`. Bun's `--hot` mode preserves server state on code changes (unlike `--watch` which does a full restart), providing a smoother development experience.

### Step 9: Amend constitution

Update Architecture & Deployment > Configuration section. Bump version to 1.2.0.

### Step 10: Run linter and type checker

Verify `bun run lint` and `bun run typecheck` pass.

### Step 11: Run tests

Verify `bun test` passes with the new config loading.
