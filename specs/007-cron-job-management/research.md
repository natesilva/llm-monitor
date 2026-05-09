# Research: Cron Job Registration & Unregistration

**Feature**: 007-cron-job-management
**Date**: 2026-05-08

## Research Findings

### R1: Bun.cron API — Registration, Removal, and Status

**Decision**: Use `Bun.cron()` for registration, `Bun.cron.remove()` for unregistration, and OS-level queries for status checking.

**Rationale**: Bun provides a complete API surface for OS-level cron management:
- `Bun.cron(workerPath, schedule, name)` — registers an OS-level scheduled task (launchd on macOS, crontab on Linux). Re-calling with the same name updates the existing job (idempotent).
- `Bun.cron.remove(name)` — removes a previously registered OS-level cron job. Succeeds silently even if no job with that name exists (no error thrown).
- `Bun.cron.parse(expression)` — parses a cron expression and returns a Date for the next scheduled fire time.
- There is no `Bun.cron.list()` or `Bun.cron.get()` API.

**Alternatives considered**:
- In-process `setInterval`-based scheduling: Rejected because the constitution (Principle V) mandates OS-level cron via `Bun.cron()`, and the one-shot bench runner must exit between invocations.
- Manual launchctl/crontab manipulation: Rejected because `Bun.cron` already wraps these platform-specific commands, and re-implementing them would add unnecessary complexity and platform-specific code.

### R2: Cron Job Status Detection

**Decision**: Query the OS scheduler directly to determine if a cron job is registered.

**Rationale**: Since `Bun.cron` has no list/get API, status checking requires platform-specific OS queries:
- **macOS**: Check `launchctl list` for entries matching `bun.cron.<name>`.
- **Linux**: Check `crontab -l` for entries matching the job name.

This can be abstracted behind a simple platform-detection check (`process.platform === "darwin"` vs `"linux"`).

**Alternatives considered**:
- Checking only via `Bun.cron.remove()` return value: Rejected because `Bun.cron.remove()` succeeds silently for non-existent jobs (no way to distinguish "existed and removed" from "never existed").
- Storing registration state in a file: Rejected because it would be stale if the user manually removes the OS-level job, creating a discrepancy between file state and actual OS state. The OS is the source of truth.
- Not providing a status command: Rejected because it's a P3 requirement in the spec and is valuable for user confidence.

### R3: Unified CLI Entry Point

**Decision**: Create a single CLI entry point (`src/bench/cron.ts`) that accepts a subcommand (`register`, `unregister`, `status`) and dispatches to the appropriate action.

**Rationale**: A single entry point is more discoverable and consistent than three separate scripts. It follows the pattern of CLI tools like `git` or `docker` where subcommands organize related operations. This replaces the existing `setup-cron.ts` with a more complete solution.

**Alternatives considered**:
- Three separate scripts (register-cron.ts, unregister-cron.ts, status-cron.ts): Rejected because it scatters related functionality across files and requires three separate npm scripts/Makefile targets.
- Adding flags to the existing `setup-cron.ts`: Rejected because `setup-cron.ts` is named for setup only, and extending it with unregister/status would violate the single-responsibility principle and be confusing.

### R4: Job Title Consistency

**Decision**: Continue using `"LLM_Monitor_Bench"` as the cron job title, and define it as a shared constant.

**Rationale**: The existing `setup-cron.ts` uses `"LLM_Monitor_Bench"` as the job title. All three operations (register, unregister, status) need to reference the same job name. Extracting it to a shared constant prevents drift. The `Bun.cron.remove()` and OS-level queries both need the exact name.

**Alternatives considered**:
- Making the job title configurable: Rejected because there's no user need for multiple concurrent cron jobs, and configurability adds complexity without value.
- Generating the title dynamically: Rejected because it would break the invariant that all commands refer to the same job.

### R5: Handling Missing Cron Job on Unregister

**Decision**: `Bun.cron.remove()` always succeeds (even for non-existent jobs). To provide useful feedback, check OS-level status before removing, and report whether a job was actually found and removed, or whether no job existed.

**Rationale**: The spec requires FR-007 ("unregister MUST NOT treat a missing cron job as an error") and FR-006 ("unregister MUST confirm successful removal, or inform the user if no job was found"). Since `Bun.cron.remove()` is silent about whether a job existed, we need the OS-level check to give the user accurate feedback.

**Alternatives considered**:
- Always calling `Bun.cron.remove()` without checking first: Rejected because it doesn't satisfy FR-006 (the user wouldn't know if a job was actually removed or if nothing happened).
- Checking after removal: Rejected because it's less intuitive than checking before and reporting the outcome clearly.
