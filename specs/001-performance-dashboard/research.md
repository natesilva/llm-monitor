# Research: LLM Performance Dashboard

## Decisions

### Runtime: Bun (latest)

**Decision**: Bun latest stable with ESM throughout.

**Rationale**: User explicitly chose Bun. Bun provides built-in APIs that
eliminate most external dependencies: cron scheduling via `Bun.cron()`, SQLite
via `Bun.sqlite()`, HTTP serving via `Bun.serve()`, HTTP client via global
`fetch()`, and test runner via `bun test`.

**Alternatives considered**: Node.js (would require external packages for cron,
SQLite, test runner).

### Module System: ESM

**Decision**: TypeScript with ES modules (`type: "module"` in package.json).

**Rationale**: Bun has first-class ESM support. This is idiomatic for modern
TypeScript/Bun projects.

**Alternatives considered**: CommonJS (legacy, not recommended for new Bun
projects).

### Scheduling: Bun.cron() (OS-level)

**Decision**: Use `Bun.cron()` to register an OS-level scheduled job. The
bench script is a one-shot process — it runs all configured endpoints, records
results, and exits. The OS-level cron invokes it on the configured schedule.

**Rationale**: `Bun.cron()` in the latest Bun versions supports OS-level cron
registration, meaning no long-running daemon process is needed. The bench
script runs once per invocation and exits, which is simpler, more robust (no
memory leaks, no process management), and aligns with standard Unix cron
patterns. If the script crashes mid-run, the next cron invocation starts
fresh.

**Alternatives considered**: In-process `Bun.cron()` with a long-running
daemon (wasteful — process idles 99% of the time between runs), node-cron
(external dep, also daemon-based), system crontab (manual setup, no Bun
integration).

### Database: Bun.sqlite()

**Decision**: Use `Bun.sqlite()` (the built-in `Database` class).

**Rationale**: Bun ships with SQLite built-in — zero external dependencies.
Single-file database, perfect for a local single-user application. Supports
both synchronous and async APIs.

**Alternatives considered**: better-sqlite3 (external native module), libsql
(external).

### HTTP Server: Bun.serve()

**Decision**: Use `Bun.serve()` for both API endpoints and static file serving.

**Rationale**: Built-in HTTP server with high performance. Handles routing,
static files, JSON responses. No Express/Koa/Hono needed.

**Alternatives considered**: Hono (lightweight, but Bun.serve() is sufficient
for our scope), Express (heavier external dep).

### Frontend Rendering

**Decision**: Server-rendered HTML with embedded client-side JavaScript for
interactivity. HTML templates served by `Bun.serve()`, chart rendering via a
minimal client-side charting library.

**Rationale**: For a single-user local dashboard, a full SPA framework is
overkill. Server-rendered HTML keeps things simple. A lightweight charting lib
is the one unavoidable external dependency since Bun has no built-in charting.

**Charting library candidates**: Chart.js (lightweight, well-maintained),
uPlot (faster, smaller, but less feature-rich). Chart.js is the recommended
default for its simplicity and line-graph support.

**Alternatives considered**: React/Vue/Svelte SPAs (overkill for scope), D3.js
(more powerful but more complex), Canvas2D API (too low-level).

### Configuration Format

**Decision**: TypeScript config file (`config.ts`) exporting typed config
objects, with environment variable override support for secrets.

**Rationale**: Since the project is TypeScript, a TS config file provides
type safety and editor autocompletion without needing a schema validation
library. Bun can `import()` config files directly. Secrets (API keys) still
use environment variables.

**Alternatives considered**: YAML/TOML/JSON (would need parsing, no type
safety without schema validation), .env only (limited for nested config
structures).

### HTTP Client: fetch()

**Decision**: Use Bun's global `fetch()` for API calls to OpenAI-compatible
endpoints.

**Rationale**: Built-in, supports streaming, HTTP/2, custom headers. Matches
the OpenAI API SDK interface without needing the SDK.

**Alternatives considered**: axios (external dep), undici (Bun already uses
its own fetch).

### Testing: Bun test

**Decision**: Use `bun test` with `describe`/`expect`/`mock`.

**Rationale**: Built-in test runner compatible with Jest API. Supports mocking
via `mock()` for HTTP endpoint simulation in integration tests.

**Alternatives considered**: vitest, jest (both external).

### Process Management

**Decision**: Two components with different lifecycle models:
- `bun run bench` → one-shot: load config, run all endpoints, record results,
  prune old data, exit. Invoked by OS-level cron.
- `bun run web` → long-running: `Bun.serve()` starts and stays running.
- `bun run bench:setup` → registers the OS-level cron job via `Bun.cron()`.

**Rationale**: The bench component doesn't need to stay running 24/7 just to
kick off periodic benchmarks. OS-level cron handles the scheduling; the script
does its work and exits. The web server must stay running to serve the
dashboard.

**Alternatives considered**: Long-running bench daemon with in-process
scheduling (wastes resources, harder to manage), pm2/concurrently for both
(unnecessary for the bench component).

## Dependencies Summary

| Dependency | Source | Purpose |
|-----------|--------|---------|
| Bun runtime | bun.sh | Runtime, OS-level cron, sqlite, HTTP, fetch, test |
| Chart.js | npm (external) | Client-side chart rendering |
| TypeScript | npm/dev | Type checking |
