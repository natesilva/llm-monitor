# CLI Contract: Cron Job Management

**Feature**: 007-cron-job-management
**Date**: 2026-05-08

## Command

```
bun run cron <subcommand>
```

## Subcommands

### `register`

Registers (or re-registers) the OS-level cron job for scheduled benchmark runs.

**Usage**: `bun run cron register`

**Preconditions**:
- A valid `config.ts` file exists in the project root
- The `bench.schedule` field in config contains a valid cron expression

**Output (success)**:
```
Cron job registered.
  Title:    LLM_Monitor_Bench
  Schedule: 30 * * * *
  Worker:   /path/to/cron-worker.ts
```

**Output (success, re-registration)**:
```
Cron job updated.
  Title:    LLM_Monitor_Bench
  Schedule: 30 * * * *
  Worker:   /path/to/cron-worker.ts
```

**Exit codes**:
- `0`: Job registered or updated successfully
- `1`: Configuration file not found or invalid

---

### `unregister`

Removes the OS-level cron job for scheduled benchmark runs.

**Usage**: `bun run cron unregister`

**Preconditions**: None (works regardless of whether a job is registered)

**Output (job existed)**:
```
Cron job removed.
  Title: LLM_Monitor_Bench
```

**Output (no job found)**:
```
No cron job found with title "LLM_Monitor_Bench".
```

**Exit codes**:
- `0`: Job removed successfully, or no job found (not an error)

---

### `status`

Checks whether the cron job is currently registered and displays its details.

**Usage**: `bun run cron status`

**Preconditions**: None

**Output (registered)**:
```
Cron job is registered.
  Title:    LLM_Monitor_Bench
  Schedule: 30 * * * *
  Worker:   /path/to/cron-worker.ts
```

**Output (not registered)**:
```
No cron job registered with title "LLM_Monitor_Bench".
To register one, run: bun run cron register
```

**Exit codes**:
- `0`: Job is registered
- `0`: Job is not registered (informational, not an error)

---

## NPM Scripts

| Script | Command |
|--------|---------|
| `cron` | `bun run src/bench/cron.ts` |

## Makefile Targets

| Target | Command |
|--------|---------|
| `cron-register` | `bun run src/bench/cron.ts register` |
| `cron-unregister` | `bun run src/bench/cron.ts unregister` |
| `cron-status` | `bun run src/bench/cron.ts status` |

## Deprecation

The existing `bench:setup` npm script and `bench-setup` Makefile target are superseded by `cron register`. They should be removed to avoid confusion.
