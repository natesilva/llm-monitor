# Feature Specification: LLM Performance Dashboard

**Feature Branch**: `001-performance-dashboard`
**Created**: 2026-05-08
**Status**: Draft
**Input**: User description: "I am building an LLM performance monitor. I want it to show useful information about speed performance of specific providers and models. There are two parts: The monitor should be able to run tests against multiple providers and models on a schedule. The dashboard should display the collected stats in an attractive and user-friendly way. The dashboard should display tiles for each tested configuration, with a graph of that configuration's tokens-per-second performance over the last 48 hours, and other relevant statistics that can help the user understand speed, reliability, and variability of the configuration. There should also be a single overall comparison graph of tokens-per-second over the last 24 hours, with all of the configurations selectable, so that they can be compared. These should be visually appealing and present the data in a simple, easy-to-understand form."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Per-Configuration Performance Tiles (Priority: P1)

As a user, I want to see a dashboard with a tile for each tested provider/model
configuration. Each tile displays a graph of tokens-per-second over the last 48
hours, along with key statistics that tell me about the speed, reliability, and
variability of that configuration.

**Why this priority**: This is the core value of the application. Without the
per-configuration tiles, the user has no visibility into individual provider/model
performance. This story can be tested with pre-seeded data and delivers immediate
usefulness.

**Independent Test**: Can be fully tested by seeding the database with sample
benchmark data for 3-5 configurations over a 48-hour period, then verifying each
tile renders a correct TPS graph and the correct set of summary statistics.

**Acceptance Scenarios**:

1. **Given** the database contains benchmark data for multiple configurations
   over the last 48 hours, **When** the user opens the dashboard, **Then** a tile
   is shown for each configuration with a TPS-over-time graph spanning 48 hours.
2. **Given** a configuration tile is displayed, **When** the user views the tile,
   **Then** it shows summary statistics including average tokens-per-second, p50
   latency, p95 latency, and success rate for the last 48 hours.
3. **Given** a configuration has no benchmark data yet, **When** the dashboard
   loads, **Then** its tile displays a "No data yet" message rather than an empty
   or broken graph.
4. **Given** a configuration experienced failures during some runs, **When** the
   user views its tile, **Then** the statistics and graph clearly indicate the
   failure rate and which data points represent failures.

---

### User Story 2 - Cross-Configuration Comparison Graph (Priority: P2)

As a user, I want to see a single overall graph comparing tokens-per-second
across all configurations over the last 24 hours, with the ability to select
which configurations appear, so that I can directly compare performance.

**Why this priority**: Comparison across providers/models is a natural next step
after seeing individual tiles. This story builds on the same data infrastructure
as Story 1 but adds cross-configuration insight.

**Independent Test**: Can be fully tested by seeding the database with benchmark
data for multiple configurations and then verifying that the comparison graph
renders correctly and configuration selection toggling works.

**Acceptance Scenarios**:

1. **Given** benchmark data exists for multiple configurations over the last 24
   hours, **When** the user views the dashboard, **Then** a comparison graph
   shows TPS over time with all configurations initially displayed.
2. **Given** the comparison graph is displayed, **When** the user deselects a
   configuration, **Then** that configuration's line is removed from the graph.
3. **Given** the comparison graph is displayed, **When** the user selects a
   previously deselected configuration, **Then** that configuration's line
   reappears on the graph.
4. **Given** the user has deselected all configurations, **When** no
   configurations remain selected, **Then** the graph displays an empty state
   with a prompt to select configurations.

---

### User Story 3 - Scheduled Multi-Provider Benchmark Runner (Priority: P3)

As a user, I want the system to automatically run benchmarks against my
configured providers and models on a recurring schedule, so that the dashboard
always has up-to-date performance data without manual intervention.

**Why this priority**: This story powers the data pipeline. Without it the
dashboard requires manual data seeding. It is prioritized behind the dashboard
because the dashboard can be built and tested with synthetic data first.

**Independent Test**: Can be fully tested by configuring two mock endpoints,
starting the scheduler, and verifying that benchmark results appear in the
database at the expected interval.

**Acceptance Scenarios**:

1. **Given** the user has configured a list of provider/model/endpoint
   configurations, **When** the scheduler runs, **Then** it executes a benchmark
   prompt against each configured endpoint and records results.
2. **Given** a benchmark run succeeds, **When** the results are recorded,
   **Then** the database contains the run timestamp, configuration label, prompt
   tokens, completion tokens, total tokens, latency in milliseconds,
   tokens-per-second, and HTTP status code.
3. **Given** an endpoint is unreachable or returns an error, **When** the
   scheduler processes that endpoint, **Then** the failure is recorded in the
   database with an error message and the scheduler continues to the next
   endpoint.
4. **Given** a new configuration is added to the configuration file, **When** the
   next scheduled run fires, **Then** the new configuration is included in the
   benchmark run automatically (config is re-read each invocation).
5. **Given** the user runs the benchmark manually, **When** `bun run bench` is
   executed, **Then** all configured endpoints are tested immediately and
   results are recorded.

### Edge Cases

- The database is empty (first launch of the system) — dashboard displays empty
  state messaging across all sections.
- All benchmark runs for a configuration fail — tile shows 100% failure rate
  with no graph data.
- A configuration is removed from the config file — its historical data remains
  in the database but its tile no longer appears on the dashboard.
- The system clock changes (e.g., daylight saving time, time zone change) —
  the 24h and 48h windows should use wall-clock time consistently.
- Very high-frequency data (schedule interval shorter than 1 minute) — graph
  data points may need to be downsampled for readability.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Dashboard MUST display a tile for each unique provider/model
  configuration that has benchmark data in the database.
- **FR-002**: Each tile MUST include a line graph of tokens-per-second over the
  most recent 48 hours of data.
- **FR-003**: Each tile MUST display the following summary statistics for the
  last 48 hours: average TPS, p50 latency, p95 latency, success rate (percentage
  of runs that returned a successful HTTP status).
- **FR-004**: Each tile SHOULD display a variability metric (e.g., standard
  deviation of TPS or latency) to help users understand consistency.
- **FR-005**: The dashboard MUST include a single comparison graph showing
  tokens-per-second over the most recent 24 hours.
- **FR-006**: The comparison graph MUST allow the user to select and deselect
  individual configurations to control which lines appear.
- **FR-007**: All dashboard elements MUST be visually appealing with consistent
  styling, readable fonts, and intuitive layout.
- **FR-008**: The system MUST run benchmarks against all configured provider,
  model, endpoint combinations on a configurable schedule.
- **FR-009**: A configuration MUST define at minimum: a human-readable label, a
  base URL, an API key or key reference, a model name, and a prompt template.
- **FR-010**: Each benchmark run MUST record: timestamp, configuration label,
  model name, prompt tokens, completion tokens, total tokens, latency in
  milliseconds, tokens-per-second, HTTP status code, and error message (if
  applicable).
- **FR-011**: Benchmark results MUST persist across system restarts.
- **FR-012**: The system MUST tolerate individual endpoint failures without
  aborting the full benchmark run.
- **FR-013**: The dashboard MUST auto-refresh data by polling the API endpoints
  every 60 seconds, updating graphs and statistics without a full page reload.

### Key Entities *(include if feature involves data)*

- **Configuration**: A named grouping of provider endpoint, model, and
  parameters. Attributes include a human-readable label, base URL, API key,
  model name, prompt template, temperature, and max tokens. Represented
  externally via configuration file entries.
- **BenchmarkRun**: A single execution of a prompt against a configuration.
  Attributes include timestamp, configuration reference, model name returned by
  the API, prompt tokens, completion tokens, total tokens, latency ms,
  tokens-per-second, HTTP status code, and optional error message. Each run
  belongs to exactly one configuration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view per-configuration tokens-per-second trends over the
  last 48 hours within 2 clicks of opening the dashboard.
- **SC-002**: Users can compare tokens-per-second across any subset of
  configurations over the last 24 hours within 3 clicks.
- **SC-003**: Users can assess speed (average TPS, p50/p95 latency), reliability
  (success rate), and variability (TPS dispersion) of any configuration at a
  glance.
- **SC-004**: Dashboard fully renders within 3 seconds on a modern browser when
  the database contains 7 days of data across 10 configurations with 1-hour
  benchmark intervals.
- **SC-005**: New benchmark data from the scheduler appears in the dashboard
  and is reflected in graphs and statistics without requiring a manual page
  reload or restart.

## Clarifications

### Session 2026-05-08

- Q: Will environment variables loaded from a `.env` file be available to the scheduled runner? → A: Yes. Bun automatically loads `.env` at process startup before any code executes. With OS-level cron (via `Bun.cron()`), each invocation starts a fresh Bun process that loads `.env` from the working directory. The cron setup script MUST configure the job's working directory to the project root so `.env` is found. API keys are resolved via `process.env[apiKeyEnvVar]` at config load time.
- Q: How should the dashboard auto-refresh (SC-005)? → A: HTTP polling — client fetches updated data every 60 seconds via existing API endpoints.

## Assumptions

- The system is deployed on a single machine for personal/local use — no
  multi-user support, authentication, or access controls are needed.
- Configurations are defined in a flat configuration file that the scheduler
  reads at startup and on each run cycle.
- Data is stored in a local embedded database — no external database server is
  required.
- The dashboard is viewed in a modern web browser on a desktop or laptop
  screen — mobile responsiveness is not required for v1.
- API keys for providers are stored in environment variables (loaded
  automatically from `.env` by Bun at process startup) and referenced by name
  in the configuration file — no secret management service integration. The
  OS-level cron job's working directory MUST be set to the project root so
  that `.env` is found by each bench invocation.
- The benchmark prompt is simple (e.g., a short text generation) and is the same
  across all configurations to enable fair comparison.
- The default schedule interval is every 60 minutes unless the user overrides it.
- Data older than 30 days may be automatically pruned to manage database size.
