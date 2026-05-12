# Research: Replace config.ts with YAML Configuration

**Branch**: `015-yaml-config-replacement` | **Date**: 2026-05-12

## R1: YAML Parsing Library — Bun Built-in vs. Third-Party

**Decision**: Use Bun's built-in `Bun.YAML.parse()` and direct `.yaml` file imports.

**Rationale**: Bun provides first-class YAML support natively:
- `Bun.YAML.parse(yamlString)` — parses YAML strings into JS objects
- `import config from "./config.yaml"` — direct module import with default/named exports
- No external dependency needed (`js-yaml` not required)
- Hot-reload support via `bun --hot` for YAML files
- Written in Zig for performance, passes 90%+ of official YAML test suite
- Supports YAML 1.2 spec including anchors, aliases, tags, multi-line strings, and comments

**Alternatives considered**:
- `js-yaml`: Most popular npm YAML library. Rejected because Bun has built-in support, adding an unnecessary dependency.
- `yaml`: Another npm YAML library. Same rejection as js-yaml.
- TOML: Mentioned in the spec as an alternative declarative format. Rejected per user preference for YAML.

## R2: Config File Loading Strategy — Import vs. Read + Parse

**Decision**: Use `Bun.YAML.parse()` with `Bun.file().text()` (read file + parse), not direct `import`.

**Rationale**: While Bun supports `import config from "./config.yaml"`, the current codebase uses a dynamic import pattern (`await import("../../config.ts")`) that catches missing-file errors gracefully. The new implementation should:
1. Read the file from a configurable path (default: `config.yaml` in project root)
2. Parse with `Bun.YAML.parse()`
3. Provide a clear error if the file is missing ("Copy config.example.yaml to config.yaml and edit it")
4. Support a `CONFIG_PATH` environment variable override for the file location

Using `import` would tie the config file path at build/module-resolution time, making it harder to support a configurable path. Reading the file at runtime gives us the flexibility we need.

**Alternatives considered**:
- Direct `import`: Would work but prevents configurable file paths and produces less helpful error messages.
- `require("./config.yaml")`: CommonJS-style, doesn't fit the ESM project.

## R3: Config File Location

**Decision**: Default to `config.yaml` in the project root. Override via `CONFIG_PATH` environment variable.

**Rationale**: The current `config.ts` lives in the project root. Following the same convention for `config.yaml` is the least surprising choice. The `CONFIG_PATH` env var allows advanced users to point to a different location (e.g., for CI/CD or multi-environment setups).

**Alternatives considered**:
- CLI `--config` flag: Adds complexity to each entry point. Can be added later if needed.
- Fixed subdirectory (e.g., `./config/app.yaml`): Adds unnecessary indirection for a single-file config.

## R4: Constitution Amendment — Configuration Section

**Decision**: The constitution's Configuration section currently states: "Configuration MUST be via environment variables with a `.env` file as default." This must be updated to: "Configuration MUST be via a YAML configuration file. Sensitive values (API keys) MUST be referenced by environment variable name in the YAML file and resolved at runtime. A `.env` file may be used to set those environment variables during development."

**Rationale**: The constitution's current wording mandates env vars as the primary config mechanism. Moving to YAML as the primary source with env vars for secrets is a material change to configuration guidance, requiring a MINOR version bump (v1.1.0 → v1.2.0).

**Alternatives considered**:
- Leave constitution as-is: Would be factually incorrect after the change.
- Treat as PATCH: Not appropriate since this materially changes guidance.

## R5: Handling YAML Parse Errors

**Decision**: Catch `SyntaxError` from `Bun.YAML.parse()` and wrap it with a user-friendly message including the file path and the parse error details.

**Rationale**: `Bun.YAML.parse()` throws a `SyntaxError` for invalid YAML. The raw error message may not include the file path. Wrapping it ensures users know which file has the problem and what the syntax issue is.

**Alternatives considered**:
- Let the error propagate: Raw YAML parse errors are not user-friendly.
- Custom YAML validation before parsing: Unnecessary since Bun's parser already provides good error messages.

## R6: Config File in .gitignore

**Decision**: Add `config.yaml` to `.gitignore` (same pattern as current `config.ts`). The `config.example.yaml` file is committed as a template.

**Rationale**: User config files contain endpoint definitions and references to API keys. While they don't contain secrets directly, they are user-specific and should not be committed. This matches the existing pattern where `config.ts` is gitignored and `config.example.ts` is committed.

**Alternatives considered**:
- Commit config.yaml: Would leak user-specific configurations and potentially reveal endpoint details.

## R7: Type Safety for YAML-Parsed Config

**Decision**: Retain the existing TypeScript types (`AppConfig`, `EndpointConfig`, etc.) from `src/shared/types.ts`. After parsing the YAML, validate the structure against these types using the existing `validateConfig()` logic (which already checks required fields, value ranges, duplicate labels).

**Rationale**: The existing types and validation are well-structured and tested. Reusing them means the YAML config has the same structural guarantees as the TypeScript config. The parsed YAML produces a plain object that is validated and normalized the same way.

**Alternatives considered**:
- Zod/valibot schema validation: Would add a dependency for something the existing code already handles.
- Loose typing (`any`): Would lose the type safety benefits the current codebase has.
