# Feature Specification: Cron Job Registration & Unregistration

**Feature Branch**: `007-cron-job-management`
**Created**: 2026-05-08
**Status**: Draft
**Input**: User description: "make it easy for the user to register the cron job, and to unregister it later."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register the scheduled bench job (Priority: P1)

A user wants to set up automated, recurring benchmark runs. They run a single command that reads their configuration, registers an OS-level cron job with the correct schedule and worker script, and confirms successful registration with clear output showing the job details.

**Why this priority**: Without registration, there is no automated monitoring — this is the foundational capability. It replaces the existing `bench:setup` command with an improved, more discoverable experience.

**Independent Test**: Can be fully tested by running the register command and verifying the OS-level cron job exists and fires on schedule. Delivers value immediately by enabling hands-off monitoring.

**Acceptance Scenarios**:

1. **Given** a valid configuration file exists, **When** the user runs the register command, **Then** the system registers the OS-level cron job and displays the job title, schedule, and worker path
2. **Given** no configuration file exists, **When** the user runs the register command, **Then** the system displays a clear error message explaining how to create the config file and exits with a non-zero status
3. **Given** a cron job with the same title is already registered, **When** the user runs the register command, **Then** the system updates the existing job with the current configuration and confirms the update

---

### User Story 2 - Unregister the scheduled bench job (Priority: P2)

A user wants to stop the automated benchmark runs (e.g., to pause monitoring, troubleshoot, or decommission). They run a single command that removes the OS-level cron job and confirms it has been removed.

**Why this priority**: The ability to undo registration is essential for user control. Without it, users would need to manually find and remove the OS-level scheduled task, which is error-prone and platform-specific.

**Independent Test**: Can be fully tested by first registering a cron job, then running the unregister command, and verifying the OS-level cron job no longer exists. Delivers value by giving users full control over the scheduling lifecycle.

**Acceptance Scenarios**:

1. **Given** a registered cron job exists, **When** the user runs the unregister command, **Then** the system removes the OS-level cron job and confirms removal
2. **Given** no registered cron job exists, **When** the user runs the unregister command, **Then** the system informs the user that no job was found to remove (not an error condition)
3. **Given** the user is unsure whether a job is registered, **When** the user runs the unregister command, **Then** the system clearly reports the current state before attempting removal

---

### User Story 3 - Check the status of the scheduled bench job (Priority: P3)

A user wants to verify whether the cron job is currently registered, and if so, see its schedule and configuration details. They run a single command that reports the current registration status.

**Why this priority**: Status checking is a convenience that supports the register/unregister workflow. Users can already infer status by running register or unregister, but an explicit check is more ergonomic and less side-effect-prone.

**Independent Test**: Can be fully tested by running the status command with and without a registered cron job, and verifying the output accurately reflects the current state.

**Acceptance Scenarios**:

1. **Given** a cron job is registered, **When** the user runs the status command, **Then** the system displays the job title, schedule, and worker path
2. **Given** no cron job is registered, **When** the user runs the status command, **Then** the system displays a clear message indicating no job is registered

---

### Edge Cases

- What happens when the user tries to unregister a job on a different OS than where it was registered (e.g., registered on macOS, then checked on Linux)?
- What happens when the configuration file specifies a different schedule than the currently registered job — does re-registration update it?
- What happens when the user runs the register command without the necessary OS permissions to create scheduled tasks?
- What happens when the worker script path has changed since the job was originally registered (e.g., the project directory was moved)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a command to register an OS-level cron job that runs the benchmark on a user-configured schedule
- **FR-002**: The system MUST provide a command to unregister (remove) the previously registered OS-level cron job
- **FR-003**: The system MUST provide a command to check whether a cron job is currently registered and display its details if so
- **FR-004**: The register command MUST read the schedule from the user's configuration file
- **FR-005**: The register command MUST confirm successful registration by displaying the job title, schedule, and worker script path
- **FR-006**: The unregister command MUST confirm successful removal, or inform the user if no job was found
- **FR-007**: The unregister command MUST NOT treat a missing cron job as an error (it should be a normal informational message)
- **FR-008**: All commands MUST display clear, actionable error messages when they cannot complete their operation (e.g., missing config, insufficient permissions)
- **FR-009**: The system MUST use a consistent, well-known job title so that register, unregister, and status commands all refer to the same scheduled task
- **FR-010**: The register command MUST handle re-registration gracefully (update the existing job rather than creating a duplicate)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can register, check status of, and unregister the cron job using a single command each, with no manual OS-level intervention required
- **SC-002**: 100% of users who successfully run the register command have a functioning scheduled benchmark within 1 minute of the next scheduled time
- **SC-003**: Users can completely remove the scheduled task with a single command, leaving no residual OS-level scheduled tasks
- **SC-004**: All three commands (register, unregister, status) complete in under 5 seconds on a typical development machine

## Assumptions

- Users run these commands from the project root directory where the configuration file resides
- The existing `Bun.cron()` API is the mechanism for interacting with OS-level scheduled tasks (launchd on macOS, crontab on Linux)
- The job title "LLM_Monitor_Bench" will continue to be used as the identifier for the scheduled task
- Users have the necessary OS permissions to create and remove scheduled tasks on their machine
- Only one instance of the cron job is expected to be registered at a time per project
- The project directory location does not change between registration and execution (the worker path is resolved at registration time)
