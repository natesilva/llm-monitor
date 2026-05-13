## 1. Config schema changes

- [x] 1.1 Add `debug` and `logFile` optional fields to `BenchConfig` in `src/shared/types.ts`
- [x] 1.2 Parse `bench.debug` and `bench.logFile` from YAML in `src/shared/config.ts` with defaults (`false` and `data/cron.log`)
- [x] 1.3 Update `config.example.yaml` with `bench.debug` and `bench.logFile` comments

## 2. Cron worker logging

- [x] 2.1 Create a `cronLogger` utility that tees console output to a log file with timestamped run headers
- [x] 2.2 Update `src/bench/cron-worker.ts` to read `bench.debug` from config and pass it to `runBench()`
- [x] 2.3 Update `src/bench/cron-worker.ts` to initialize the cron logger with the configured log file path

## 3. cron run subcommand

- [x] 3.1 Add a `run` subcommand to `src/bench/cron.ts` that loads config, runs `runBench(config.bench.debug)`, and logs output to the configured log file
- [x] 3.2 Update the usage/help text in `src/bench/cron.ts` to include the `run` subcommand

## 4. Tests

- [x] 4.1 Update `src/bench/cron-worker.test.ts` to verify debug flag is read from config and passed to `runBench`
- [x] 4.2 Add tests for the cron logger utility (file creation, append behavior, directory creation)
- [x] 4.3 Add tests for the `cron run` subcommand
