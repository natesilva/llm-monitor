# Quickstart: Cron Job Management

**Feature**: 007-cron-job-management

## Register the cron job

```bash
bun run cron register
```

This reads your `config.ts` and registers an OS-level scheduled task that runs benchmarks on the configured schedule.

## Check if the cron job is registered

```bash
bun run cron status
```

## Unregister the cron job

```bash
bun run cron unregister
```

This removes the OS-level scheduled task. Benchmarks stop running automatically.

## Run a benchmark manually

This is unchanged — run a one-off benchmark anytime:

```bash
bun run bench
```
