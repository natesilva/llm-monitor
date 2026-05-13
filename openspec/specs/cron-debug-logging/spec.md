## ADDED Requirements

### Requirement: Config-driven debug flag for cron runs
The system SHALL support an optional `bench.debug` boolean field in `config.yaml`. When set to `true`, the cron worker SHALL pass `debug=true` to `runBench()`. When absent or `false`, the cron worker SHALL pass `debug=false`.

#### Scenario: bench.debug is true
- **WHEN** `config.yaml` contains `bench.debug: true` and a scheduled cron run executes
- **THEN** the cron worker calls `runBench(true)` and debug output (request bodies, SSE events, responses) is printed to console and the log file

#### Scenario: bench.debug is false or absent
- **WHEN** `config.yaml` does not contain `bench.debug` or sets it to `false`
- **THEN** the cron worker calls `runBench(false)` and only summary output is produced

### Requirement: File-based cron logging
The system SHALL write cron execution output to a log file. Each scheduled run SHALL append a timestamped header followed by the run's console output. The log file path SHALL be configurable via `bench.logFile` in `config.yaml`, defaulting to `data/cron.log` relative to the project root.

#### Scenario: Default log file path
- **WHEN** `bench.logFile` is not specified in `config.yaml`
- **THEN** cron execution output is appended to `data/cron.log`

#### Scenario: Custom log file path
- **WHEN** `bench.logFile` is set to a custom path in `config.yaml`
- **THEN** cron execution output is appended to that path

#### Scenario: Log file directory does not exist
- **WHEN** the directory for the log file path does not exist
- **THEN** the system creates the directory before writing

#### Scenario: Multiple cron runs
- **WHEN** multiple cron runs execute sequentially
- **THEN** each run's output is appended to the log file with a timestamped separator, preserving all previous output

### Requirement: cron run subcommand
The `cron` CLI SHALL support a `run` subcommand that manually executes the cron worker path: loading dotenv, loading config, and calling `runBench()` with the `bench.debug` setting from config. Output SHALL be written to both console and the configured log file.

#### Scenario: Running cron run
- **WHEN** the user executes `bun run cron run`
- **THEN** the system loads the environment, loads config, runs benchmarks with the `bench.debug` setting, writes output to console and the log file, and exits with code 0 on success or 1 on failure

#### Scenario: cron run with debug enabled in config
- **WHEN** `bench.debug` is `true` and the user runs `bun run cron run`
- **THEN** debug-level output is visible in both the console and the log file
