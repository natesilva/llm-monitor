# Research: Bench Debug Flag

**Date**: 2026-05-08
**Feature**: Add debug flag to bench runner for request/response logging

## Decision 1: CLI Argument Parsing Method

**Decision**: Parse `--debug` using `util.parseArgs` with `Bun.argv` — `parseArgs({ args: Bun.argv, options: { debug: { type: "boolean" } }, strict: true, allowPositionals: true })`.

**Rationale**:
- `util.parseArgs` is a Node.js/Bun built-in — no external dependency needed
- `Bun.argv` is the idiomatic Bun equivalent of `process.argv` (per Bun docs)
- Provides structured parsing with type coercion (`values.debug` is a boolean)
- `strict: true` catches typos (e.g., `--debg` would error instead of silently ignored)
- `allowPositionals: true` lets us accept positional args without conflict
- Consistent with the project's Minimal & Composable principle — built-in, no deps

**Alternatives considered**:
- `process.argv.includes("--debug")`: Simpler but no type coercion, no typo protection, less idiomatic for Bun
- Argument parsing library (commander, yargs): Overkill for a single flag; violates Minimal principle
- Environment variable (`DEBUG=1 bun run bench`): Less discoverable than a CLI flag; harder to remember

## Decision 2: Flag Naming

**Decision**: Use `--debug` as the flag name.

**Rationale**:
- `--debug` is universally understood by developers
- Short and memorable
- Common convention across CLI tools
- Distinct from `--verbose` (which might imply more general logging, not just request/response)

**Alternatives considered**:
- `--verbose`: More general; could imply different levels of verbosity
- `-v`: Too terse; `--debug` is self-documenting
- `--dump`: Implies file output rather than console output

## Decision 3: Where to Thread the Debug Flag

**Decision**: Add a `debug` boolean parameter to `runAllEndpoints()` and `runEndpoint()`.

**Rationale**:
- Simple parameter threading through the call chain: `main()` → `runAllEndpoints(db, endpoints, debug)` → `runEndpoint(db, endpoint, debug)`
- No global state, no environment variable needed
- The cron job (setup-cron.ts) invokes `bun run src/bench/index.ts` without `--debug`, so cron behavior is unchanged
- Only the interactive CLI usage gets debug output

**Alternatives considered**:
- Global variable / module-level state: Breaks composability; makes testing harder
- Environment variable: Already available via `process.env.DEBUG` but less explicit than a CLI flag
- Store in config.ts: Would require config changes — spec says "runtime option only"

## Decision 4: Response Truncation Strategy

**Decision**: Truncate response body output to 1000 characters with a `...` suffix when exceeded.

**Rationale**:
- 1000 characters is enough to see the full response for typical chat completions
- Simple `text.slice(0, 1000)` implementation
- `...` suffix makes truncation obvious to the user
- Request body is not truncated (it's constructed by the runner and is always small)

**Alternatives considered**:
- No truncation: Large responses (e.g., with long completions) could flood the terminal
- 500 characters: Too short — might cut off the important parts of the response
- Configurable limit: Overkill for a debug flag
