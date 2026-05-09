# Feature Specification: Custom Bench Prompt

**Feature Branch**: `005-custom-bench-prompt`
**Created**: 2026-05-08
**Status**: Draft
**Input**: User description: "Allow the user to specify the prompt to send. Make the default be 'What is photosynthesis? Give a brief overview.'"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Custom Prompt via CLI Flag (Priority: P1)

As a developer or operator running benchmarks, I want to specify the prompt text sent to each endpoint so that I can test different scenarios and compare how models respond to various inputs.

**Why this priority**: Without a custom prompt option, the user must edit `config.ts` to change the prompt for every benchmark run. A CLI flag enables quick, zero-modification experimentation.

**Independent Test**: Run the bench command with `--prompt "custom text"` and verify the custom text appears in the request body for each endpoint.

**Acceptance Scenarios**:

1. **Given** the `--prompt` flag is provided with a value, **When** a benchmark request is sent, **Then** the provided prompt text is used as the user message content instead of the configured default
2. **Given** the `--prompt` flag is not provided, **When** a benchmark request is sent, **Then** the default prompt ("What is photosynthesis? Give a brief overview.") is used as the user message content
3. **Given** an endpoint has a `promptTemplate` configured in `config.ts`, **When** `--prompt` is provided on the CLI, **Then** the CLI prompt overrides the per-endpoint configured prompt
4. **Given** the `--help` flag is passed, **When** the bench runner starts, **Then** the `--prompt` option is listed in the help output

---

### Edge Cases

- What happens if `--prompt` is passed with an empty string? (Use the empty string as-is — the user explicitly chose it)
- What happens if `--prompt` contains special characters or quotes? (Pass the raw string through to the API request body)
- What happens if `--prompt` is very long? (No truncation — the full text is sent; the API will enforce its own limits)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The bench runner MUST accept a `--prompt` CLI flag that specifies the prompt text to send to each endpoint
- **FR-002**: When `--prompt` is provided, the specified text MUST override the `promptTemplate` for every endpoint in that run
- **FR-003**: When `--prompt` is not provided, the default prompt MUST be "What is photosynthesis? Give a brief overview."
- **FR-004**: The `--prompt` flag MUST be listed in the `--help` output
- **FR-005**: The `--prompt` flag MUST NOT change the stored configuration or affect cron-scheduled runs (which invoke the bench without CLI flags)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Running the bench with `--prompt "custom text"` sends that exact text as the user message to each endpoint
- **SC-002**: Running the bench without `--prompt` sends "What is photosynthesis? Give a brief overview." as the default prompt
- **SC-003**: The feature requires no configuration file changes — it is a runtime option only
- **SC-004**: Scheduled (cron) runs are unaffected since they do not pass `--prompt`

## Assumptions

- The `--prompt` flag uses `util.parseArgs` with `Bun.argv`, consistent with the existing `--debug` and `--help` flag pattern
- The default prompt value ("What is photosynthesis? Give a brief overview.") replaces the current hardcoded default ("Hello, please respond with a short greeting.")
- A single `--prompt` value applies to all endpoints in the run — per-endpoint prompt override via CLI is out of scope
- When `--prompt` is provided, it overrides even per-endpoint `promptTemplate` values configured in `config.ts`
- The `--prompt` flag is a string type argument (not boolean), requiring a value after the flag
