# Feature Specification: Separate TTFT and TPS Stats

**Feature Branch**: `012-separate-ttfs-tps-stats`  
**Created**: 2026-05-11  
**Status**: Draft  
**Input**: User description: "Separate time-to-first-token (TTFS) stats from tokens-per-second (tps) stats. Currently they are combined and this obscures the true TTFS and tps status. Each stat should be recorded separately, and there should be a fallback method for inference endpoints that don't support the correct options to report the stats separately."

## Clarifications

### Session 2026-05-11

- Q: What happens when the endpoint sends the first chunk immediately (TTFT ≈ 0)? → A: Record 0ms as-is; it is valid data included in all aggregations without special treatment.
- Q: How are runs with zero completion tokens (error responses) handled for TPS and TTFT? → A: TPS = 0 (zero tokens generated, zero throughput — stored as 0 to keep the column non-null). TTFT = null if no chunk was received; recorded value if at least one chunk arrived before the error.
- Q: What happens if the streaming connection is interrupted mid-response? → A: Run marked failed; TTFT recorded if ≥1 chunk received, TPS = null; errorMessage captures the reason.
- Q: How does aggregation behave when all TTFT values in a time window are null? → A: P50/P95 TTFT return null; stat tiles display "N/A".
- Q: What if an endpoint sends all tokens in a single chunk (no inter-token timing)? → A: TTFT = time to that chunk; TPS = null; total-latency-derived TPS stored as fallback throughput signal.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Accurate TPS Stats (Priority: P1)

As a user monitoring inference endpoints, I want to see tokens-per-second as a measure of pure streaming throughput—not conflated with the time spent waiting for the first token—so I can accurately evaluate an endpoint's generation speed independently of its latency.

**Why this priority**: The core problem. Currently TPS is computed from total end-to-end time, which means a slow-to-start but fast-streaming model looks worse than it is, and vice versa. Fixing the calculation is the fundamental deliverable.

**Independent Test**: Run a benchmark against a streaming-capable endpoint, observe that TPS reflects only inter-token throughput (time from first token to last token), and confirm the value differs from the old total-latency-derived calculation when first-token latency is significant.

**Acceptance Scenarios**:

1. **Given** a streaming-capable endpoint, **When** a benchmark run completes, **Then** `tokensPerSecond` reflects only the time elapsed from the first token to the last token (streaming throughput), not total wall-clock time.
2. **Given** results in the dashboard, **When** viewing per-run data, **Then** TPS and TTFT are displayed as separate, labeled metrics.
3. **Given** a run where first-token latency is high but generation is fast, **When** TPS is displayed, **Then** it is not artificially depressed by the first-token wait.

---

### User Story 2 - View Accurate Time-to-First-Token Stats (Priority: P1)

As a user monitoring inference endpoints, I want to see time-to-first-token as a distinct metric so I can evaluate endpoint responsiveness separately from raw generation throughput.

**Why this priority**: Equal priority to TPS separation—both are two sides of the same fix. TTFT measures perceived responsiveness; TPS measures throughput. Neither can be derived from the other.

**Independent Test**: Run a benchmark against a streaming-capable endpoint, observe a separate TTFT field in the results (time from request send to arrival of the first token chunk), and confirm it is recorded in the database and shown in the UI.

**Acceptance Scenarios**:

1. **Given** a streaming-capable endpoint, **When** a benchmark run completes, **Then** `timeToFirstTokenMs` is recorded as the elapsed time from when the request was sent until the first response chunk arrived.
2. **Given** results in the dashboard, **When** viewing per-configuration stats, **Then** aggregated TTFT metrics (P50, P95) are displayed alongside TPS metrics.
3. **Given** historical data collected before this feature, **When** viewing aggregated stats, **Then** runs without TTFT data are handled gracefully (e.g., shown as N/A, excluded from TTFT aggregation).

---

### User Story 3 - Fallback for Non-Streaming Endpoints (Priority: P2)

As a user benchmarking an inference endpoint that does not support streaming, I want the tool to still record useful stats, with a clear indication that TTFT and TPS cannot be separated, so I understand the limitations of the measurement.

**Why this priority**: Not all endpoints support streaming. The tool must remain useful and not break for these configurations, even though the stats will be less precise.

**Independent Test**: Configure an endpoint with streaming disabled (or one that does not support streaming), run a benchmark, observe that the run completes successfully, and confirm the UI/output clearly indicates TTFT is unavailable for that run.

**Acceptance Scenarios**:

1. **Given** an endpoint configured without streaming support, **When** a benchmark run completes, **Then** the run is recorded with total latency and total-latency-derived TPS (current behavior), and `timeToFirstTokenMs` is recorded as null/absent.
2. **Given** a mix of streaming and non-streaming runs in the dashboard, **When** aggregated TTFT stats are shown, **Then** non-streaming runs are excluded from TTFT calculations without causing errors.
3. **Given** a non-streaming run in the data table, **When** the TTFT column is displayed, **Then** the cell shows a clear indicator (e.g., "N/A") rather than a misleading zero or blank.

---

### Edge Cases

- **TTFT ≈ 0**: A TTFT of 0ms is valid data (the endpoint responded nearly instantly). It is recorded as-is and included in aggregations without special treatment.
- **Zero completion tokens (error or empty response)**: If a run produces zero completion tokens, TPS is recorded as 0 (zero tokens were generated; storing 0 keeps the column non-null and accurately reflects zero throughput). If the stream errored before any chunk arrived, TTFT is also null. If a first chunk arrived before the error, TTFT is still recorded.
- **Interrupted streaming connection**: The run is marked as failed (non-2xx equivalent error). `timeToFirstTokenMs` is recorded if at least one chunk was received before interruption; TPS is recorded as null (partial stream makes throughput unreliable). `errorMessage` captures the interruption reason.
- **All-null TTFT in a time window**: When every run in the selected window has null TTFT (e.g., all non-streaming or all pre-migration), P50 and P95 TTFT are returned as null. The stat tiles display "N/A" rather than 0 or an error.
- **Single-chunk streaming response**: If the endpoint sends all content in one SSE chunk (no inter-token timing observable), TTFT is recorded as the time to that chunk, and TPS is recorded as null. Total-latency-derived TPS is stored instead so the run is not left without any throughput signal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST measure and record time-to-first-token (TTFT) as the elapsed time from when the benchmark request is sent until the first response data chunk is received, for streaming-capable endpoints.
- **FR-002**: System MUST measure and record tokens-per-second (TPS) as completion tokens divided by the time elapsed from the first token chunk to the last token chunk, for streaming-capable endpoints.
- **FR-003**: System MUST continue to record total end-to-end latency as a separate metric, independent of TTFT and TPS.
- **FR-004**: System MUST persist `timeToFirstTokenMs` per benchmark run; this field MUST be nullable to support non-streaming runs and legacy data.
- **FR-005**: System MUST support a streaming mode for endpoint configurations and a non-streaming fallback mode; the measurement strategy MUST differ between the two.
- **FR-006**: In non-streaming (fallback) mode, the system MUST record total latency and derive TPS from total latency (existing behavior), with `timeToFirstTokenMs` recorded as null.
- **FR-007**: The dashboard MUST display TTFT (P50, P95) as distinct aggregated metrics alongside TPS metrics.
- **FR-008**: The dashboard MUST display TTFT per run in data tables, showing "N/A" for runs where TTFT was not captured.
- **FR-009**: Aggregated TTFT statistics MUST exclude runs where `timeToFirstTokenMs` is null (they must not skew or break the calculation).
- **FR-010**: Aggregated TPS statistics in streaming mode MUST reflect streaming throughput (inter-token rate), not total-latency-derived throughput.
- **FR-011**: When a streaming run produces zero completion tokens, TPS MUST be recorded as 0 (zero throughput, column remains non-null); TTFT MUST be recorded as null if no chunk was received, or as the measured value if at least one chunk arrived before failure. When the stream is interrupted, TPS MUST be 0 and TTFT follows the same rule.
- **FR-012**: When a streaming endpoint returns all content in a single chunk (no inter-token interval), TPS MUST be recorded as null and total-latency-derived TPS MUST be stored as a fallback throughput signal for that run; TTFT MUST be recorded as the time to that single chunk.
- **FR-013**: Aggregated TTFT metrics (P50, P95) MUST return null and display as "N/A" when no runs in the selected time window have a non-null TTFT value.

### Key Entities

- **BenchmarkRun**: A single timed request. Gains nullable `timeToFirstTokenMs` field. The `tokensPerSecond` field gains a new semantic: streaming throughput (not total-latency TPS) when streaming is used.
- **ConfigStats**: Aggregated metrics per configuration. Gains `p50TtftMs` and `p95TtftMs` fields. Existing `avgTps` and `tpsStdDev` continue to represent TPS (now streaming-accurate where available).
- **EndpointConfig**: Configuration for an inference target. Gains a `streaming` boolean (or equivalent) to indicate whether streaming mode should be used for benchmarking.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For streaming endpoints, the recorded TPS value for a run is strictly greater than the total-latency-derived TPS whenever TTFT > 0, demonstrating the metrics are correctly separated.
- **SC-002**: For streaming endpoints with more than one token, the sum of TTFT and (completion_tokens / TPS * 1000) approximates total latency within ±50ms or ±5% of total latency (whichever is larger), validating internal consistency of the three measurements.
- **SC-003**: Non-streaming endpoint benchmarks complete without errors and display cleanly in the UI, with TTFT shown as N/A.
- **SC-004**: Users can identify at a glance whether a configuration's slow average latency is due to high TTFT (responsiveness problem) vs. low TPS (throughput problem).
- **SC-005**: Existing benchmark runs stored in the database continue to display correctly after the schema migration.

## Assumptions

- The inference endpoints targeted by this tool speak the OpenAI chat completions API format; streaming will be implemented via the standard `stream: true` parameter and server-sent events (SSE).
- Endpoints that do not support `stream: true` will return an error or ignore the parameter; the fallback will be triggered by detecting a non-streaming response format or by explicit per-endpoint configuration.
- Token counts in streaming mode will be obtained from the stream's final `usage` chunk (if available) or estimated from the number of content chunks as a fallback.
- The existing `latencyMs` column semantics are preserved (total wall-clock time) for backwards compatibility; it is not repurposed.
- Displaying TTFT aggregates (P50/P95) in the comparison chart is out of scope for the initial implementation; the chart will continue to show TPS. TTFT aggregates will appear in the per-configuration stat tiles and data tables.
- Mobile UI support is not a concern for this feature; the existing responsive layout is sufficient.
