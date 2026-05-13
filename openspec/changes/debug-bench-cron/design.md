## Context

The bench cron job runs benchmarks on a schedule via `Bun.cron`. The cron worker (`src/bench/cron-worker.ts`) calls `runBench()` with no debug flag, and cron output goes to the system's cron logging infrastructure (launchd stdout on macOS, cron syslog on Linux) which is difficult to access and not persisted in a user-friendly way. When a scheduled benchmark fails silently or behaves unexpectedly, the only recourse is to run `bun run bench --debug` manually — but that doesn't reproduce the scheduled context and the issue may be intermittent.

Current state:
- `runBench(debug, prompt?)` accepts a debug flag but the cron worker hardcodes `debug=false`
- Console output from cron workers is typically lost or requires digging through system logs
- No `cron run` subcommand exists — you can only `register`, `unregister`, or check `status`

## Goals / Non-Goals

**Goals:**
- Allow enabling debug logging for cron runs via config (`bench.debug`)
- Persist cron execution output to a log file so it survives process termination
- Provide a `cron run` subcommand to manually invoke the cron worker path with debug

**Non-Goals:**
- Structured/JSON logging or log rotation
- Real-time log tailing or log viewer UI
- Alerting on cron failures
- Changing the bench runner's debug output format

## Decisions

### 1. Config-driven debug flag (`bench.debug`)

**Decision**: Add an optional `bench.debug` boolean to `config.yaml`, defaulting to `false`. The cron worker reads this value and passes it to `runBench()`.

**Alternatives considered**:
- Environment variable (`BENCH_DEBUG=1`): requires remembering to set it in the cron environment, easy to forget
- CLI flag on the cron worker: cron workers don't receive CLI args
- Always-on debug: too noisy for production, generates excessive output

**Rationale**: Config is the natural place since the cron worker already loads config. It's persistent, version-controllable, and doesn't require environment setup.

### 2. File-based logging

**Decision**: The cron worker writes stdout/stderr to a log file at `data/cron.log` (relative to project root). Each run appends to the file with a timestamped header. A `bench.logFile` config option allows overriding the path; defaults to `data/cron.log`.

**Alternatives considered**:
- System log integration (launchd/syslog): platform-specific, hard to access
- SQLite logging table: overkill, requires schema migration, console output is what users already expect
- Separate log per run: creates many files, hard to find the right one

**Rationale**: A single append-only log file is simple, portable, and can be inspected with standard tools (`tail`, `less`). It mirrors the project's existing pattern of storing data under `data/`.

### 3. `cron run` subcommand

**Decision**: Add a `run` subcommand to `src/bench/cron.ts` that executes the cron worker path (i.e., calls `runBench()` with the config's debug setting). This simulates what the cron scheduler would do, including dotenv loading.

**Alternatives considered**:
- Just use `bun run bench --debug`: doesn't exercise the cron worker code path (dotenv loading, config-based debug flag)
- Separate script: adds another entry point to maintain

**Rationale**: Reuses the cron worker logic while allowing on-demand execution. Useful for verifying config changes or reproducing scheduled-run behavior.

## Risks / Trade-offs

- [Log file grows unbounded] → Mitigation: Keep it simple for now; users can truncate or delete the file. Log rotation is a non-goal but could be added later.
- [Config change requires re-registration?] → No. The cron worker loads config fresh on each invocation via `loadConfigFromYaml()`, so config changes take effect on the next scheduled run without re-registering.
- [bench.debug could leak API details to log file] → Mitigation: Debug output already redacts API keys (only logs request body and response, not headers). Log file should have same permissions as the DB file.
