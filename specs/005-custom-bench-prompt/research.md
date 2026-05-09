# Research: Custom Bench Prompt

**Date**: 2026-05-08
**Feature**: Add --prompt CLI flag to bench runner for custom prompt text

## Decision 1: Argument Type for --prompt

**Decision**: Use `type: "string"` in `util.parseArgs` for the `--prompt` option.

**Rationale**:
- `--prompt` requires a value (the prompt text), unlike `--debug` and `--help` which are booleans
- `util.parseArgs` with `type: "string"` enforces that a value must follow the flag
- Consistent with the existing `util.parseArgs` + `Bun.argv` pattern from feature 004
- Passing `--prompt` without a value will produce a clear error from `strict: true` mode

**Alternatives considered**:
- Boolean flag + separate positional argument: Breaks the existing pattern; less intuitive (`--debug --prompt "text"` vs `--prompt "text"`)
- Environment variable: Less discoverable; conflicts with the CLI-first UX of the bench runner

## Decision 2: Override Semantics — CLI vs Config

**Decision**: The `--prompt` CLI flag overrides ALL endpoint `promptTemplate` values for that run. When absent, the default flow applies: per-endpoint `promptTemplate` if configured, otherwise the global default.

**Rationale**:
- Spec FR-002 explicitly states "override the promptTemplate for every endpoint"
- Simpler to reason about — one CLI flag, one prompt for all endpoints
- Per-endpoint CLI prompt overrides are out of scope (spec assumption)
- The `--debug` flag from feature 004 follows the same "applies to all endpoints" pattern

**Alternatives considered**:
- Merge CLI prompt with per-endpoint template: Ambiguous semantics; no clear use case
- Only override endpoints without a custom promptTemplate: Confusing — user expects `--prompt` to be the prompt

## Decision 3: Default Prompt Change

**Decision**: Change `DEFAULTS.promptTemplate` in `src/shared/config.ts` from `"Hello, please respond with a short greeting."` to `"What is photosynthesis? Give a brief overview."`.

**Rationale**:
- Spec FR-003 mandates the new default
- The new default is a more realistic benchmark prompt — it requests substantive content, which better exercises token generation and TPS measurement
- "Hello, please respond with a short greeting" often produces tiny completions that don't stress the model meaningfully
- The change affects all endpoints that don't specify a custom `promptTemplate` in config

**Alternatives considered**:
- Keep old default and add new default as separate constant: Adds complexity for no benefit; the new default is strictly better for benchmarking
- Make default configurable: Overkill — the user can always use `--prompt` or `promptTemplate` in config

## Decision 4: Where to Apply the Override

**Decision**: Thread the `prompt` string from `index.ts` → `scheduler.ts` → `runner.ts`. In `runner.ts`, if `prompt` is provided, use it instead of `endpoint.promptTemplate` when constructing the request body.

**Rationale**:
- Follows the exact same parameter-threading pattern as `--debug` (feature 004)
- Minimal change — just one more parameter in the same call chain
- The runner already uses `endpoint.promptTemplate` in the body construction; replacing it with the override is a one-line change
- No changes to the `ResolvedEndpoint` type or config resolution logic

**Alternatives considered**:
- Mutate the endpoint objects before passing to runAllEndpoints: Side effects; breaks the "config is read-only" pattern
- Pass the override in a context/options object: Overkill for a single string; adds a new type
