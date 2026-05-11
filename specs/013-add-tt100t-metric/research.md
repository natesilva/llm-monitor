# Research: Add TT100T Metric

**Feature**: `013-add-tt100t-metric`
**Date**: 2026-05-11

## Decision 1: Token Counting Method for TT100T

**Decision**: Count tokens from `delta.content` and `delta.reasoning_content` chunks using the same text-length/4 heuristic already used for the `streamedTextLength` fallback. When the `usage` chunk arrives, the cumulative token count is not used for TT100T — the `usage` chunk comes at stream end, so it cannot inform a 100-token threshold mid-stream.

**Rationale**: The runner already tracks `streamedTextLength` (summing content + reasoning content lengths). Dividing by ~4 chars/token gives a running token estimate. The `js-tiktoken` library could provide exact token counts per chunk, but adding a tokenizer import and per-chunk encoding call in the hot loop would add complexity for marginal accuracy gain — the 100-token threshold is a coarse measure by design.

**Alternatives considered**:
- Use `js-tiktoken` to count exact tokens per chunk: rejected — adds a dependency call in the hot streaming loop; TT100T is a coarse metric and chunk-boundary approximation is acceptable per spec
- Count SSE chunks (not text length): rejected — providers batch multiple tokens per chunk, so chunk count ≠ token count
- Wait for `usage` chunk to compute TT100T retrospectively: rejected — `usage` arrives only at stream end; TT100T must be measured in real-time

---

## Decision 2: TT100T Measurement Point

**Decision**: Record `performance.now()` at the first SSE chunk where the cumulative estimated token count reaches or exceeds 100. This is a chunk-boundary approximation — the actual 100th token may have arrived within the chunk, but we measure at the chunk boundary.

**Rationale**: Streaming SSE delivers tokens in batches. We cannot know when within a chunk the Nth token was generated — we only know when the chunk arrived. The chunk arrival time is the best available proxy. This is explicitly acknowledged in the spec (Edge Case: "TT100T is measured from request start to the chunk boundary where cumulative token count reaches or exceeds 100").

**Alternatives considered**:
- Interpolate within a chunk: rejected — no per-token timing within a chunk; interpolation would be speculative
- Require exact 100-token measurement: rejected — impossible with SSE batching without provider-specific token timing APIs

---

## Decision 3: TT100T Null Conditions

**Decision**: `tt100tMs` is `null` when: (a) fewer than 100 tokens were generated, (b) the run was non-streaming, (c) the run failed before reaching 100 tokens, or (d) the run is a pre-migration legacy row.

**Rationale**: TT100T is undefined when per-token timing is unavailable (non-streaming) or when 100 tokens were never reached. This follows the same nullable pattern as `ttftMs`. Null means "not measured" — dashboard displays "N/A" consistently.

**Alternatives considered**:
- Store a computed estimate for non-streaming runs (e.g., `ttftMs + 100/tps * 1000`): rejected — mixing measured and estimated values in the same column is misleading
- Store 0 for sub-100-token runs: rejected — 0 is indistinguishable from a genuine 0ms measurement

---

## Decision 4: Database Column Type

**Decision**: Use `INTEGER` for `tt100t_ms` (matching `latency_ms` pattern), unlike `ttft_ms` which uses `REAL`. Store `Math.round()` of the measurement.

**Rationale**: TT100T is measured from `performance.now()` differences, which yield sub-millisecond precision. Rounding to integer milliseconds is consistent with `latency_ms` and avoids floating-point noise in the dashboard. The `ttft_ms` column used `REAL` but in practice all values are whole milliseconds — the column type difference is historical, not intentional. Going forward, `INTEGER` is preferred for millisecond measurements.

**Alternatives considered**:
- Use `REAL` to match `ttft_ms`: rejected — REAL is unnecessary for ms-precision values and introduces floating-point representation concerns
- Use `BIGINT`: rejected — SQLite stores all integers the same way internally; INTEGER is sufficient for millisecond timestamps

---

## Decision 5: Stats Aggregation for TT100T

**Decision**: Compute `avgTt100tMs` (arithmetic mean) in `computeStats()`, excluding null values. Use average rather than percentiles to keep the stats tile simple and because TT100T variance is typically low relative to its magnitude.

**Rationale**: The spec requires "average TT100T" (FR-007). Average is intuitive and sufficient for the composite responsiveness metric. P50/P95 could be added later but are not required by the spec. This parallels the `avgTps` pattern rather than the `p50TtftMs`/`p95TtftMs` pattern.

**Alternatives considered**:
- Add P50/P95 TT100T like TTFT: rejected — spec only requires average; percentiles would add UI clutter for a composite metric whose value is already an average
- Use median instead of mean: rejected — spec explicitly says "average"; median would be inconsistent

---

## Decision 6: Cumulative Token Tracking in the Streaming Loop

**Decision**: Add a `cumulativeTokens` counter in the streaming loop. Each content/reasoning chunk increments it by `Math.round(chunkTextLength / 4)`. When `cumulativeTokens >= 100` and `tt100tTimestamp` has not been recorded, set `tt100tTimestamp = performance.now()`.

**Rationale**: The runner already tracks `streamedTextLength` (total across all chunks) and `totalChunkCount`. Adding a running token estimate that triggers at the 100-token boundary is a minimal extension. The `Math.round(textLength / 4)` heuristic is the same one used for the post-stream token estimation fallback, so the token counting is consistent within a single run.

**Alternatives considered**:
- Use `js-tiktoken` for per-chunk token counting: rejected — see Decision 1
- Count total chunks until 100: rejected — providers batch different numbers of tokens per chunk
- Track after the stream ends: rejected — the whole point is measuring wall-clock time during streaming

---

## Decision 7: Console Log Output

**Decision**: Append TT100T to the streaming success log line when available. Format: `OK — 42.5 TPS, 185ms TTFT, 2610ms TT100T, 1200ms total, 120 tokens`.

**Rationale**: Consistent with the existing pattern of including key metrics in the console log. TT100T is a primary metric and should be visible at a glance. When null (sub-100-token runs), omit the TT100T portion.

**Alternatives considered**:
- Always show TT100T even when null: rejected — "null TT100T" in console output is noisy; omitting is cleaner
- Show only TT100T (replacing TTFT): rejected — TTFT and TPS remain valuable separately per spec Assumptions
