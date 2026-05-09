# Feature Specification: Bench Debug Flag

**Feature Branch**: `004-bench-debug-flag`  
**Created**: 2026-05-08  
**Status**: Draft  
**Input**: User description: "Add a debug feature/flag/or CLI option that optionally shows the request and response on the CLI when `bun run bench` runs."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verbose Request/Response Logging (Priority: P1)

As a developer or operator running benchmarks, I want to optionally see the full HTTP request and response details for each endpoint so that I can debug issues like unexpected errors, incorrect request bodies, or mismatched API responses.

**Why this priority**: Without visibility into the actual request/response payloads, diagnosing benchmark failures requires modifying source code — this flag provides a zero-modification debugging path.

**Independent Test**: Run the bench command with the debug flag enabled and verify that the request body and response body are printed to the console for each endpoint.

**Acceptance Scenarios**:

1. **Given** the debug flag is enabled, **When** a benchmark request is sent, **Then** the full request body and response body are printed to the console
2. **Given** the debug flag is not enabled, **When** a benchmark request is sent, **Then** only the existing summary line is printed (no request/response details)
3. **Given** a benchmark request fails, **When** the debug flag is enabled, **Then** the response body (including error details) is still printed

---

### Edge Cases

- What happens with very large response bodies? (Truncate the output to a reasonable limit to avoid flooding the terminal)
- What happens when the response is not JSON? (Print the raw text, truncated)
- What happens when the flag is passed but no endpoints are configured? (No additional output — no requests to debug)

## Clarifications

### Session 2026-05-08

- Q: How should CLI arguments be parsed? → A: Use `util.parseArgs` with `Bun.argv` as documented at https://bun.com/docs/guides/process/argv

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The bench runner MUST accept a `--debug` flag via `util.parseArgs({ args: Bun.argv, options: { debug: { type: "boolean" } }, strict: true, allowPositionals: true })` that enables verbose logging of request and response details
- **FR-002**: When the debug flag is enabled, the runner MUST print the full request body sent to each endpoint
- **FR-003**: When the debug flag is enabled, the runner MUST print the response body received from each endpoint
- **FR-004**: When the debug flag is not enabled, the runner MUST produce the same output as it does today (no change to default behavior)
- **FR-005**: Response output MUST be truncated if it exceeds a reasonable length to avoid flooding the terminal
- **FR-006**: The bench runner MUST accept a `--help` flag (via the same `util.parseArgs` call) that prints usage information including the `--debug` and `--help` flags, then exits

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Running the bench with the debug flag prints request and response bodies for each endpoint
- **SC-002**: Running the bench without the debug flag produces identical output to the current behavior
- **SC-003**: Response output is truncated to prevent terminal flooding when responses are large
- **SC-004**: The feature requires no configuration file changes — it is a runtime option only

## Assumptions

- The debug flag is a `--debug` command-line argument parsed via `util.parseArgs` with `Bun.argv`
- A truncation limit of 1000 characters for response bodies provides enough context without flooding the terminal
- The flag does not affect what data is stored in the database — only what is printed to the console
- This feature does not change the web dashboard or cron behavior
