<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 (template) → 1.0.0 (initial fill) → 1.1.0 (architecture update) → 1.2.0 (configuration update)
  v1.0.0: Initial fill of all template placeholders
  v1.1.0: Updated Process Topology — bench process changed from long-running
    daemon to one-shot runner invoked by OS-level cron (via Bun.cron()).
    Rationale: User requested no long-running bench daemon; OS-level cron
    is simpler and more robust.
  v1.2.0: Updated Configuration — replaced executable config.ts with declarative
    config.yaml. Rationale: Declarative YAML config eliminates arbitrary code
    execution risk at load time and separates configuration from code.
  Modified principles: N/A (principles unchanged)
  Modified sections:
    - Architecture & Deployment > Process Topology
    - Architecture & Deployment > Configuration
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no changes needed
    - .specify/templates/spec-template.md ✅ no changes needed
    - .specify/templates/tasks-template.md ✅ no changes needed
    - .specify/templates/checklist-template.md ✅ no changes needed
  Follow-up TODOs: None
-->

# LLM Monitor Constitution

## Core Principles

### I. Scheduled Benchmarking

The system MUST run benchmarks on a configurable schedule. Each benchmark
MUST execute a prompt against each configured OpenAI-compatible endpoint and
capture the following metrics per run: latency (ms), tokens-per-second, prompt
tokens, completion tokens, total tokens, and HTTP status code. The scheduler
MUST tolerate transient endpoint failures and report errors without
terminating the full run.

### II. Metrics Dashboard

A web dashboard MUST display captured benchmark metrics over time. Charts
MUST include at minimum: tokens-per-second over time, latency over time
(p50/p95/p99), and token usage per model/endpoint. The dashboard MUST NOT
require authentication for read access (local-only assumption). It SHOULD
auto-refresh or provide a manual refresh control.

### III. OpenAI-API Compatible

All monitored endpoints MUST expose an OpenAI-compatible chat completions API
(`/v1/chat/completions`). The system MUST support configurable base URLs, API
keys, models, prompt templates, temperature, max tokens, and request timeout.
Endpoint configuration MUST be externalized (env vars or config file), never
hard-coded.

### IV. Persistent Metrics Store

Benchmark results MUST be persisted to a local SQLite database (or equivalent
embedded store). The schema MUST store at minimum: run timestamp, endpoint
label, model name, prompt tokens, completion tokens, total tokens, latency ms,
tokens-per-second, HTTP status, and error message (if any). Historical data
MUST be queryable by time range, model, and endpoint. Data retention MUST be
configurable.

### V. Minimal & Composable

The system MUST ship as two independent processes: `llm-monitor-bench`
(scheduled benchmark runner) and `llm-monitor-web` (metrics web server). They
MUST communicate only through the shared metrics database. No shared runtime,
no message bus, no external cache. Each process MUST be runnable independently
with clear startup/shutdown semantics.

## Architecture & Deployment

### Process Topology

- `llm-monitor-bench`: One-shot benchmark runner. Invoked by an OS-level
  scheduled job (registered via `Bun.cron()`). On each invocation it reads
  configuration, runs all endpoints, records results, prunes old data, and
  exits. No process stays running between invocations.
- `llm-monitor-web`: Long-running HTTP server serving the metrics dashboard.
  Must start up without any existing database (empty state renders "no data"
  view, not an error).

### Configuration

Configuration MUST be via a YAML configuration file. Sensitive values (API keys)
MUST be referenced by environment variable name in the YAML file and resolved at
runtime. A `.env` file may be used to set those environment variables during
development. Minimum config: list of endpoint definitions (base URL, model,
apiKeyEnvVar), schedule interval, database path, and HTTP listen address/port.

## Development Workflow

### Testing Requirements

- Unit tests required for: benchmark result parsing, metric calculations,
  database read/write operations.
- Integration test required for: end-to-end benchmark run against a mock
  OpenAI endpoint, verifying database records are correctly written.
- Web dashboard MUST render without JavaScript errors given a known set of
  test data.

### Schema Migrations

- SQL schema changes MUST be applied via explicit migration scripts, never
  by auto-creation at runtime in production mode.
- Migration scripts MUST be idempotent.

### Code Quality

- All new code MUST be formatted with the project's configured formatter.
- Linting MUST pass before merge.
- Secrets (API keys, etc.) MUST NOT be committed to version control.

## Governance

This constitution defines the non-negotiable architecture, principles, and
workflow for the LLM Monitor project. All code contributions MUST comply with
the principles herein.

### Amendment Procedure

1. A proposal MUST be documented describing the change, rationale, and impact
   on existing principles.
2. Approval requires majority consensus among active contributors.
3. The constitution MUST be updated with a new version number per semantic
   versioning rules:
   - MAJOR: Backward incompatible principle removals or redefinitions.
   - MINOR: New principle added or materially expanded guidance.
   - PATCH: Clarifications, wording, typo fixes, non-semantic refinements.
4. This Governance section itself is MAJOR-version territory and requires
   super-majority (2/3) approval to amend.

### Compliance Review

- Every feature specification MUST include a "Constitution Check" section
  that identifies which principles the feature touches and confirms compliance.
- Implementation plans MUST justify any complexity that appears to violate
  the Minimal & Composable principle.

**Version**: 1.2.0 | **Ratified**: 2026-05-08 | **Last Amended**: 2026-05-12
