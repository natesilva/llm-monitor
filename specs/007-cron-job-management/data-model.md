# Data Model: Cron Job Registration & Unregistration

**Feature**: 007-cron-job-management
**Date**: 2026-05-08

## Entities

### CronJob

Represents an OS-level scheduled task managed by `Bun.cron()`.

| Field | Type | Description |
|-------|------|-------------|
| name | string | The unique identifier for the cron job (constant: `"LLM_Monitor_Bench"`) |
| schedule | string | Cron expression defining when the bench runs (e.g., `"30 * * * *"`) |
| workerPath | string | Absolute path to the cron worker script |
| registered | boolean | Whether the job is currently registered with the OS scheduler |

**Validation Rules**:
- `name` must be non-empty and match the constant `"LLM_Monitor_Bench"`
- `schedule` must be a valid cron expression (5-field format)
- `workerPath` must be an absolute path to an existing file

**State Transitions**:
```
[unregistered] --register--> [registered]
[registered] --unregister--> [unregistered]
[registered] --register (re)--> [registered] (updated)
[unregistered] --unregister--> [unregistered] (no-op, informational message)
```

### CronJobStatus

Result of checking whether a cron job is registered with the OS.

| Field | Type | Description |
|-------|------|-------------|
| exists | boolean | Whether the job is registered in the OS scheduler |
| name | string | The job name that was queried |
| schedule | string | The cron schedule (only present if exists is true) |
| workerPath | string | The worker script path (only present if exists is true) |

## Relationships

- `CronJob` is a singleton — there is exactly one named `"LLM_Monitor_Bench"` per project
- `CronJobStatus` is a read-only projection of the OS scheduler state for a given `CronJob`
- The `schedule` and `workerPath` for a `CronJob` are derived from the user's `AppConfig` and the project's file structure respectively

## Notes

- No persistent storage is introduced by this feature. The OS scheduler (launchd/crontab) is the source of truth for registration state.
- The `CronJob` entity is conceptual — it's not stored in the database. It represents the runtime state of the OS-level scheduled task.
