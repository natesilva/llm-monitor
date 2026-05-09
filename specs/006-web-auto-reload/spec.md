# Feature Specification: Web Auto-Reload

**Feature Branch**: `006-web-auto-reload`
**Created**: 2026-05-08
**Status**: Draft
**Input**: User description: "the web site should reload automatically if the source code tree changes"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Web Server Restart on Code Changes (Priority: P1)

As a developer working on the web dashboard, I want the web server to automatically restart when I change source files so that I can see my changes reflected immediately without manually stopping and restarting the server.

**Why this priority**: Manual restart-after-every-edit is the single biggest friction point in frontend/backend development. Auto-reload eliminates the edit-restart-verify cycle.

**Independent Test**: Start the web server in development mode, edit a source file, and verify the server restarts and serves updated content without manual intervention.

**Acceptance Scenarios**:

1. **Given** the web server is running in development mode, **When** a source file is modified, **Then** the server automatically restarts and serves the updated code
2. **Given** the web server is running in development mode, **When** a source file is created or deleted, **Then** the server automatically restarts
3. **Given** the web server is running in normal (production) mode, **When** a source file is modified, **Then** the server does NOT restart (auto-reload is a development feature only)
4. **Given** the web server is restarting due to a file change, **When** a second file change occurs during restart, **Then** the server completes the current restart before processing the next change (debouncing)

---

### Edge Cases

- What happens if the server fails to start after a code change (syntax error)? (The watcher should log the error and keep watching — the server restarts on the next valid change)
- What happens if the config file changes? (Config is loaded at startup, so a restart picks up the new config)
- What happens if many files change at once (e.g., git checkout)? (Debouncing coalesces rapid changes into a single restart)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The web server MUST automatically restart when source files change, but only when running in development mode
- **FR-002**: Development mode MUST be opt-in (e.g., a CLI flag or separate script) — the default `bun run web` command MUST NOT auto-reload
- **FR-003**: The watcher MUST debounce file change events to avoid rapid successive restarts
- **FR-004**: The watcher MUST monitor the `src/` directory for file changes
- **FR-005**: When a restart fails (e.g., syntax error), the watcher MUST log the error and continue watching for further changes

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Editing a source file while running the web server in development mode causes the server to restart within 2 seconds
- **SC-002**: Running the web server in default (non-development) mode shows no file-watching behavior
- **SC-003**: Making 5 file changes in rapid succession (within 1 second) results in at most 1-2 restarts, not 5

## Assumptions

- Auto-reload is a development-time convenience only — it has no effect on production deployments or cron-triggered bench runs
- The feature uses `bun --watch` which is a built-in Bun flag that watches imported files and fully restarts the process on changes — no external dependencies or custom watcher code needed
- Debouncing and error recovery are handled natively by `bun --watch`
- Only files imported by the web server process are watched (which covers all of `src/` that the server depends on)
