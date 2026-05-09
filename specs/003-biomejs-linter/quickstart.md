# Quickstart: Add Project Linter (BiomeJS)

## Prerequisites

- Bun runtime installed
- Project dependencies installed (`bun install`)

## Setup

No additional setup required. Biome runs via `bunx biome` (no global install needed).

## Commands

```bash
# Lint and format check (CI mode — no writes, exits non-zero on issues)
make lint
# or: bun run lint

# Lint and format fix (writes changes)
make fmt
# or: bun run fmt

# Typecheck (unchanged)
make typecheck
```

## What Changed

- **Replaced Prettier** with Biome as the formatter (`fmt` command)
- **Added `lint`** command for lint checking
- **Added `biome.json`** at project root for configuration
- Biome handles both linting and formatting in a single tool

## Verification

```bash
# 1. Install deps
bun install

# 2. Run linter — should pass with zero errors
bun run lint

# 3. Run formatter — should make no changes
bun run fmt

# 4. Verify typecheck still passes
bun run typecheck
```
