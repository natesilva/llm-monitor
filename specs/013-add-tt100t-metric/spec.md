# Feature Specification: Add Time-to-First-100-Tokens Metric

**Feature Branch**: `013-add-tt100t-metric`  
**Created**: 2026-05-11  
**Status**: Draft  
**Input**: User description: "Add a metric for 'time to first 100 tokens'. Inference providers can have greatly varying time-to-first-token and tokens-per-second metrics that don't necessarily reflect a user's experience when using the provider in a chat app or a coding app. For example, one provider may have a TTFT of 30 seconds and TPS of 200. Another provider may have a TTFT of 1.5 seconds and a TPS of 90. The second provider will likely feel much more responsive in an interactive environment. This new metric is meant to more accurately reflect that, allowing the user to compare and select the provider that is most responsive."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compare Provider Responsiveness for Interactive Use (Priority: P1)

A user evaluating LLM providers for an interactive chat or coding application needs a single metric that reflects perceived responsiveness. TTFT alone misses sustained generation speed; TPS alone misses startup latency. A provider with TTFT=30s and TPS=200 produces first-100-tokens in ~30.5s, while one with TTFT=1.5s and TPS=90 produces them in ~2.6s. The second provider feels far more responsive, but the current metrics don't surface this clearly.

**Why this priority**: This is the core value — a single, intuitive metric that captures the real-world responsiveness a user experiences, combining both prefill and early generation speed.

**Independent Test**: Can be tested by running benchmarks against two providers with different TTFT/TPS profiles and verifying that the TT100T metric correctly reflects which one is more responsive for interactive use.

**Acceptance Scenarios**:

1. **Given** a provider with high TTFT and high TPS (e.g., TTFT=30s, TPS=200), **When** the benchmark completes, **Then** TT100T is approximately 30.5s (30s prefill + ~0.5s for 100 tokens at 200 TPS)
2. **Given** a provider with low TTFT and moderate TPS (e.g., TTFT=1.5s, TPS=90), **When** the benchmark completes, **Then** TT100T is approximately 2.6s (1.5s prefill + ~1.1s for 100 tokens at 90 TPS)

*Note: Cross-provider dashboard comparison is covered by US2 acceptance scenario below.*

---

### User Story 2 - View TT100T Alongside Existing Metrics (Priority: P2)

A user viewing the dashboard wants to see TT100T displayed alongside TTFT and TPS so they can evaluate both raw performance characteristics and the composite responsiveness metric together.

**Why this priority**: Dashboard visibility makes the metric actionable. Without it, the data exists in the database but isn't accessible for comparison.

**Independent Test**: Can be tested by viewing the dashboard and verifying TT100T appears in tile stats and the data overlay table.

**Acceptance Scenarios**:

1. **Given** the user views a config tile on the dashboard, **When** the tile renders, **Then** TT100T is displayed as a summary statistic alongside Avg TTFT and Avg TPS
2. **Given** the user opens the data overlay table for a config, **When** the table renders, **Then** each row shows TT100T alongside TTFT, TPS, and latency
3. **Given** a benchmark run where fewer than 100 tokens were generated, **When** the user views metrics, **Then** TT100T is displayed as null/unavailable since the metric cannot be computed
4. **Given** two providers with different TTFT/TPS profiles (e.g., one with TTFT=30s/TPS=200, another with TTFT=1.5s/TPS=90), **When** the user compares TT100T on the dashboard, **Then** the second provider shows a significantly lower (better) TT100T despite having lower TPS

---

### Edge Cases

- What happens when fewer than 100 tokens are generated? TT100T cannot be computed and should be stored as null.
- What happens for non-streaming responses? TT100T cannot be measured since individual token timing is unavailable; store as null.
- What happens when a provider batches tokens (multiple tokens per chunk)? TT100T is measured from request start to the chunk boundary where cumulative token count reaches or exceeds 100, which is the best approximation available from streaming data.
- What happens for historical data that lacks TT100T? The database migration should handle null values gracefully; dashboard should display "N/A" for null TT100T (consistent with TTFT null display).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The benchmark runner MUST capture TT100T (time from request start to the point at which 100 completion tokens have been generated) during each streaming benchmark run
- **FR-002**: The system MUST store TT100T as a separate field in the benchmark data store alongside existing metrics
- **FR-003**: The data store MUST support a migration path for existing records that lack TT100T values (nullable column)
- **FR-004**: The dashboard stats tiles MUST display average TT100T as a summary statistic
- **FR-005**: The data overlay table MUST include TT100T as a column alongside existing TTFT and TPS columns
- **FR-006**: The API endpoints that return metrics data MUST include TT100T in their response payloads
- **FR-007**: The stats computation MUST calculate average TT100T alongside existing stats
- **FR-008**: For runs where fewer than 100 tokens are generated, TT100T MUST be stored as null
- **FR-009**: For non-streaming responses, TT100T MUST be stored as null since per-token timing is unavailable
- **FR-010**: TT100T MUST be measured in milliseconds and represent the wall-clock time from request initiation to the arrival of the 100th completion token

### Key Entities

- **BenchmarkRun**: Extended with a new `tt100tMs` (time-to-first-100-tokens in milliseconds) attribute. Nullable — null when fewer than 100 tokens were generated or when streaming data is unavailable.
- **MetricsDataPoint**: Extended with `tt100tMs` attribute (nullable) for per-data-point TT100T values.
- **ConfigStats**: Extended with `avgTt100tMs` attribute for TT100T aggregate statistics.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify the most responsive provider for interactive use by comparing TT100T values, even when TTFT and TPS individually suggest different rankings
- **SC-002**: TT100T correctly reflects the combined effect of prefill latency and generation speed (e.g., a provider with TTFT=1.5s/TPS=90 has lower TT100T than one with TTFT=30s/TPS=200)
- **SC-003**: All existing dashboard features continue to function correctly after the change
- **SC-004**: Historical benchmark data without TT100T values is still queryable and displayable without errors

## Assumptions

- TT100T is measured using cumulative token count from streaming chunks, not from reported usage (which arrives only at the end). Tokens are estimated per chunk using a text-length/4 heuristic (approximately 4 characters per token), consistent with the existing post-stream token estimation fallback.
- For providers that batch multiple tokens per chunk, TT100T is measured at the chunk boundary where cumulative tokens reach or exceed 100. This is an approximation but is the best available from streaming data.
- TT100T complements rather than replaces TTFT and TPS — all three metrics remain valuable for different analytical purposes.
- The threshold of 100 tokens is fixed and not user-configurable (could be made configurable in a future iteration).
