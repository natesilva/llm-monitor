# Research: Add Project Linter (BiomeJS)

**Date**: 2026-05-08
**Feature**: Add BiomeJS linter to the project

## Decision 1: Linter Choice — BiomeJS

**Decision**: Use BiomeJS (@biomejs/biome) as the unified linter/formatter.

**Rationale**:
- User explicitly requested BiomeJS
- Biome is a single tool that handles both linting and formatting, replacing Prettier
- Fast (Rust-based, no Node.js overhead for lint runs)
- Supports TypeScript and JavaScript out of the box
- Zero-config defaults follow established conventions (similar to Prettier)
- Compatible with Bun runtime project (`bunx biome` works)

**Alternatives considered**:
- ESLint + Prettier: More established but requires two tools, more config, and plugin management. More complex for a project this size.
- Deno lint: Only works with Deno runtime
- oxlint: Linting only, no formatting; would still need Prettier

## Decision 2: Replacing Prettier vs. Running Alongside

**Decision**: Replace Prettier entirely with Biome's formatter.

**Rationale**:
- Biome's formatter is Prettier-compatible (93%+ formatting compatibility)
- Running both creates confusion about which tool is authoritative
- Single tool = single config file = less maintenance
- Constitution principle V (Minimal & Composable) favors fewer tools

**Alternatives considered**:
- Keep both: Adds complexity, potential for conflicting rules, violates Minimal principle
- Biome lint + Prettier format: Still two tools, still two configs

## Decision 3: Biome Configuration Strategy

**Decision**: Use Biome's recommended defaults with minimal overrides to match existing Prettier output.

**Rationale**:
- Biome's defaults are well-considered and match common community standards
- Current project uses Prettier defaults (no .prettierrc), so minimal config needed
- Only override: ensure line width and quote style match what Prettier already produces

**Specific config needed**:
- `formatter.indentStyle`: "space" (matches Prettier default)
- `linter.enabled`: true with `recommended` rules
- JavaScript/TypeScript-specific: default settings sufficient
- Ignore `src/web/static/` HTML files (non-JS)
- Ignore `specs/` directory (documentation, not source)

## Decision 4: Integration with Existing Toolchain

**Decision**: Add `lint` and `fmt` scripts using `bunx biome`, update Makefile accordingly.

**Rationale**:
- `bunx` avoids global install requirement
- Existing Makefile pattern uses `bunx` for other tools (tsc, prettier)
- `lint` = check mode (CI-friendly), `fmt` = write mode (developer-friendly)
- Consistent with user instruction to keep changes minimal

**Commands**:
- `bunx biome check src/` — lint + format check (no writes)
- `bunx biome check --write src/` — lint + format fix (writes)
- `bunx biome lint src/` — lint only
- `bunx biome format --write src/` — format only
