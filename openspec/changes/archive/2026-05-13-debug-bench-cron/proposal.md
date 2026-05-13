## Why

When the bench cron job fails or behaves unexpectedly, there is no way to diagnose what happened. The cron worker calls `runBench()` with debug disabled, cron output goes to system logs that are hard to access, and there is no persistent record of cron execution (success or failure). Running the bench manually with `--debug` is the only debugging path, which doesn't help when the issue is specific to the scheduled context.

## What Changes

- Add a `bench.debug` config option in `config.yaml` that, when enabled, causes the cron worker to run benchmarks with debug logging active
- Add file-based logging for cron job execution so output persists beyond the process lifetime (cron stdout/stderr are typically lost or buried in system logs)
- Add a `cron run` subcommand to manually trigger the cron worker path (with debug) without waiting for the next scheduled tick

## Capabilities

### New Capabilities
- `cron-debug-logging`: File-based logging for cron job execution and a config-driven debug flag that propagates to the bench runner

### Modified Capabilities

## Impact

- `src/shared/types.ts` — new `debug` field on `BenchConfig`
- `src/shared/config.ts` — parse `bench.debug` from YAML with default `false`
- `src/bench/cron-worker.ts` — pass `debug` from config to `runBench()`, log output to file
- `src/bench/cron.ts` — add `run` subcommand
- `config.example.yaml` — add `bench.debug` with comment
- `src/bench/cron-worker.test.ts` — update tests for debug flag and logging
