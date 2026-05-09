# Feature Specification: Cache-Bust Request User

**Feature Branch**: `002-cache-bust-user`  
**Created**: 2026-05-08  
**Status**: Draft  
**Input**: User description: "Add a request-specific `User:` value to the body being sent to the inference server. This will ensure that the server does not return a cached value, which would result in inaccurate stats."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unique Per-Request Identifier (Priority: P1)

As a system operator running benchmarks, I want each benchmark request to include a unique identifier so that inference servers cannot return cached responses, ensuring my performance measurements reflect actual computation rather than cached lookups.

**Why this priority**: Without this, all benchmark data may be inaccurate due to cached responses, making the entire monitoring system unreliable.

**Independent Test**: Can be fully tested by running two consecutive benchmark requests and verifying that each receives a fresh (non-cached) response, as evidenced by varying latency and token counts.

**Acceptance Scenarios**:

1. **Given** a benchmark endpoint is configured, **When** a benchmark request is sent, **Then** the request includes a unique identifier that differs from any previously sent request
2. **Given** two consecutive benchmark requests to the same endpoint, **When** both complete, **Then** each request carried a different unique identifier
3. **Given** a benchmark request, **When** the identifier is generated, **Then** it contains enough randomness or uniqueness to make caching impractical for the server

---

### Edge Cases

- What happens when the server ignores the identifier and caches anyway? (No action needed — the identifier is a best-effort cache-busting measure; server-side caching policies are outside our control)
- What happens if identifier generation fails? (Use a timestamp-only fallback so the request still proceeds)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each benchmark request MUST include a unique, per-request value in the `user` field of the request body
- **FR-002**: The unique value MUST differ between every request within a single benchmark run and across runs
- **FR-003**: The unique value MUST be generated automatically without requiring user configuration
- **FR-004**: The unique value MUST be included in every request to every configured endpoint

### Key Entities

- **Benchmark Request**: The HTTP request sent to an inference server; now includes a `user` field with a unique per-request value
- **Unique Request Identifier**: A value generated per request that ensures the server cannot match it to a previous cached response

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every benchmark request sent by the system includes a unique `user` value that differs from all other requests
- **SC-002**: Consecutive benchmark runs against the same endpoint produce response latencies that vary naturally (indicating fresh computation), not identical cached responses
- **SC-003**: The system requires no additional user configuration to enable this behavior — it works by default

## Assumptions

- The `user` field in OpenAI-compatible chat completion request bodies is the standard mechanism for server-side cache-busting; servers use it as a cache key component
- A combination of timestamp and random value provides sufficient uniqueness for cache-busting purposes
- This change affects only the benchmark runner's outgoing requests; it does not change stored data, database schema, or dashboard behavior
