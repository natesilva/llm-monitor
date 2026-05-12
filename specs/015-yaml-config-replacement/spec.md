# Feature Specification: Replace config.ts with YAML Configuration

**Feature Branch**: `015-yaml-config-replacement`
**Created**: 2026-05-12
**Status**: Draft
**Input**: User description: "Replace the configuration file, currently `config.ts` with a YAML file. `config.ts` will no longer be supported and we don't care about migration or backwards compatibility. Ensure there's an example YAML file, and an example .env file (showing how to set the API key values that are referenced in the YAML file)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure the application via YAML (Priority: P1)

A user wants to configure the LLM monitor application by editing a YAML file. They create a YAML config file defining their benchmark schedule, endpoints, web server settings, and database options. The application reads this YAML file at startup and uses it as the sole source of configuration.

**Why this priority**: This is the core value proposition — replacing the TypeScript-based configuration with YAML. Without this, nothing else works.

**Independent Test**: Can be fully tested by placing a YAML file with known values, starting the application, and verifying that all configuration values (schedule, endpoints, web settings, db path) are correctly loaded and used.

**Acceptance Scenarios**:

1. **Given** a valid YAML config file exists at the expected path, **When** the application starts, **Then** all configuration values are loaded from the YAML file and the application runs correctly with those values.
2. **Given** a YAML config file with missing required fields, **When** the application starts, **Then** a clear error message identifies which fields are missing.
3. **Given** a YAML config file with invalid values (e.g., temperature out of range), **When** the application starts, **Then** a clear validation error is reported.

---

### User Story 2 - Reference environment variables for API keys (Priority: P2)

A user wants to keep API keys out of the YAML config file by referencing environment variable names. The YAML file specifies which environment variable holds each API key, and the application resolves those at runtime from the environment.

**Why this priority**: This is essential for security — API keys must not be stored in plain text config files. It's the existing pattern from config.ts that must be preserved.

**Independent Test**: Can be tested by setting environment variables, providing a YAML file that references them by name, and verifying the application successfully connects to each endpoint using the resolved keys.

**Acceptance Scenarios**:

1. **Given** a YAML config references `apiKeyEnvVar: OPENAI_API_KEY` for an endpoint, **When** the environment variable `OPENAI_API_KEY` is set, **Then** the application resolves the API key from the environment and uses it for that endpoint.
2. **Given** a YAML config references an environment variable that is not set, **When** the application starts, **Then** a clear error message names the missing variable and the endpoint that requires it.

---

### User Story 3 - Use example files as a starting point (Priority: P3)

A new user wants to get started quickly by copying example configuration files. They copy the example YAML file and example .env file, fill in their own values, and the application works.

**Why this priority**: Onboarding experience — example files reduce friction for new users but are not required for the core functionality.

**Independent Test**: Can be tested by copying the example files, filling in real values, and verifying the application starts and functions correctly.

**Acceptance Scenarios**:

1. **Given** a user copies the example YAML file and example .env file, **When** they fill in real values for their endpoints and API keys, **Then** the application starts and functions correctly.
2. **Given** the example files, **When** a user reviews them, **Then** all configurable options are documented with comments explaining each value and its defaults.

---

### Edge Cases

- What happens when the YAML file has syntax errors (e.g., bad indentation)?
- What happens when the YAML file contains unknown/extra keys not part of the schema?
- What happens when a required environment variable is set but empty?
- What happens when no YAML config file is found at the expected path?

## Requirements *(mandatory)*

### Motivation

The current configuration approach uses an executable TypeScript file (`config.ts`), which is inherently insecure — executable config files can run arbitrary code at load time, making them a vector for supply-chain attacks and accidental side effects. Declarative configuration formats (YAML, JSON, TOML, etc.) cannot execute code, eliminating this risk. YAML has been chosen for its readability and support for comments, which make it well-suited for user-edited configuration files.

### Functional Requirements

- **FR-001**: Application MUST read all configuration from a YAML file as the sole configuration source (replacing config.ts).
- **FR-002**: Application MUST resolve API keys from environment variables referenced by name in the YAML file (not store keys directly in YAML).
- **FR-003**: Application MUST validate all configuration values on startup, including required fields, value ranges, and duplicate endpoint labels.
- **FR-004**: Application MUST apply sensible defaults for optional configuration values (temperature, maxTokens, timeoutMs, port, host, retentionDays, dbPath).
- **FR-005**: Application MUST provide clear, actionable error messages when configuration is invalid or incomplete.
- **FR-006**: Project MUST include an example YAML configuration file (`config.example.yaml`) with all available options documented.
- **FR-007**: Project MUST include an example `.env` file (`.env.example`) showing how to set the API key environment variables referenced in the YAML config.
- **FR-008**: The existing `config.ts` module MUST be removed and replaced by the new YAML-based configuration loader.
- **FR-009**: The YAML configuration structure MUST preserve the same logical structure as the current AppConfig (bench, web, db sections).
- **FR-010**: The `web:dev` script MUST use `--hot` instead of `--watch` so that code changes preserve server state during reloads, providing a better development experience than full-process restarts.

### Key Entities

- **YAML Config File**: The primary configuration artifact, containing bench schedule, endpoint definitions, web server settings, and database options. Maps directly to the current AppConfig structure.
- **Environment Variables**: External key-value pairs holding API keys, referenced by name in the YAML config. Each endpoint specifies which environment variable holds its API key.
- **Example Files**: `config.example.yaml` and `.env.example` — template files shipped with the project that demonstrate all available configuration options with placeholder values and documentation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can configure and run the application using only a YAML file and environment variables, with no TypeScript configuration editing required.
- **SC-002**: All existing application functionality (bench scheduling, endpoint testing, web dashboard, data persistence) works identically when configured via YAML instead of config.ts.
- **SC-003**: A new user can go from zero to running application by copying two example files and filling in their own values, with no need to read source code.
- **SC-004**: Every invalid or missing configuration value produces an error message that identifies the specific field and what is wrong, with no unhelpful generic errors.

## Clarifications

### Session 2026-05-12

- Q: Why replace executable config with declarative config beyond convenience? → A: Using executable code (a `.ts` file) for configuration is not secure — it can run arbitrary code at load time, making it a vector for supply-chain attacks. Declarative formats (YAML, JSON, TOML) cannot execute code, eliminating this risk. YAML is chosen for readability and comment support.
- Q: Should the dev server use Bun's hot reloading for YAML? → A: Yes — switch `web:dev` from `--watch` to `--hot` so that code changes preserve server state during reloads, providing a better development experience than full-process restarts.

## Assumptions

- The YAML config file will be located at a predictable path (e.g., `config.yaml` in the project root or a path specified via CLI argument or environment variable).
- Bun's built-in `Bun.YAML.parse()` API will be used; no external YAML parsing dependency is needed.
- No migration path from config.ts to YAML is needed — users will write new YAML configs from scratch or use the example file.
- The existing TypeScript types (AppConfig, EndpointConfig, etc.) may be retained or adapted to match the YAML-parsed structure, as long as the runtime behavior is equivalent.
- The `.env.example` file is for documentation only; the application does not automatically load `.env` files (users manage their environment as they see fit).
