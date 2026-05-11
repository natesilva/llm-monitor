# Research: Separate TTFT and TPS Stats

**Feature**: `012-separate-ttfs-tps-stats`  
**Date**: 2026-05-11

## Decision 1: SSE Streaming Mechanism

**Decision**: Use Bun's native `ReadableStream` via `response.body` to consume SSE chunks. Parse each `data: {...}` line manually — no external library needed.

**Rationale**: Bun's `fetch` returns a standard Web Streams `ReadableStream` on `response.body`. The OpenAI SSE format is simple enough to parse with a split on `\n` and a `data:` prefix check. Adding an npm package for SSE parsing would violate the Minimal & Composable principle.

**Alternatives considered**:
- `eventsource` npm package: rejected — adds a dependency, overkill for a client-side stream
- Node.js `http` module directly: rejected — Bun's fetch is already sufficient and more ergonomic

**Implementation pattern**:
```
const decoder = new TextDecoder();
for await (const chunk of response.body) {
  const text = decoder.decode(chunk);
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
      const parsed = JSON.parse(line.slice(6));
      // process delta
    }
  }
}
```

---

## Decision 2: First-Token Detection

**Decision**: The first SSE chunk whose `choices[0].delta.content` is a non-empty string marks the first token. Record `performance.now() - start` at that moment as TTFT.

**Rationale**: OpenAI-compatible endpoints typically send a first chunk with an empty `delta.content` (role announcement) followed by content chunks. Filtering for non-empty content ensures we measure when actual output begins arriving, not when the stream opens.

**Edge case**: If the first chunk already contains content (some endpoints skip the role chunk), that chunk's arrival time is still used — this is correct behavior.

**Alternatives considered**:
- Use any first chunk (including role chunk): rejected — inflates TTFT for endpoints that send role chunk separately from content
- Use `data: [DONE]` sentinel: rejected — that is last token, not first

---

## Decision 3: Token Counting in Streaming Mode

**Decision**: Request `stream_options: { include_usage: true }` alongside `stream: true`. Parse the final `usage` chunk for authoritative token counts. If no `usage` chunk arrives (endpoint doesn't support `stream_options`), count content chunks as a rough token approximation.

**Rationale**: `stream_options.include_usage` is supported by OpenAI and most compatible endpoints. It provides exact token counts without requiring a separate non-streaming call. Chunk-counting as fallback is an approximation (each SSE chunk ≠ exactly one token) but acceptable for endpoints that lack this capability.

**Alternatives considered**:
- Always use chunk count: rejected — too inaccurate (some endpoints batch multiple tokens per chunk)
- Require `usage` chunk or fail: rejected — breaks compatibility with endpoints that don't support `stream_options`

---

## Decision 4: TPS Computation Window

**Decision**: TPS = `completionTokens / ((lastChunkTime - firstChunkTime) / 1000)`. If only one content chunk was received (first == last), TPS is null and total-latency-derived TPS is stored instead.

**Rationale**: The inter-token interval isolates generation throughput from TTFT. Single-chunk responses have no measurable inter-token interval so streaming TPS is undefined — total-latency-derived TPS is the best available signal in that case and is stored in the `tps` column without null to avoid gaps in the TPS chart.

**Alternatives considered**:
- Use `TTFT-to-last-chunk` window: rejected — includes TTFT in the denominator, same problem as before
- Always store null for single-chunk: rejected — produces a gap in the TPS chart that is less useful than the approximate total-latency figure

---

## Decision 5: Non-Streaming Fallback Detection

**Decision**: `EndpointConfig` gains an optional `streaming` boolean (default `true`). When `streaming: false`, the runner uses the existing non-streaming code path. No auto-detection — the operator must explicitly opt out.

**Rationale**: Auto-detecting streaming support (by trying streaming and catching errors) adds latency and complexity. Operators know their endpoints. The current YAML/env config already controls per-endpoint settings; `streaming: false` follows that pattern naturally.

**Alternatives considered**:
- Try streaming, retry without on error: rejected — doubles request latency on failure; ambiguous error signals
- Always stream: rejected — some endpoints do not support SSE and would consistently fail

---

## Decision 6: Database Migration Strategy

**Decision**: Add migration `0002_add_ttft.sql` containing `ALTER TABLE benchmark_runs ADD COLUMN ttft_ms REAL;`. The existing `schema.ts` migration runner already applies SQL files in order; existing rows get `NULL` in `ttft_ms` automatically (SQLite default for new nullable columns).

**Rationale**: SQLite `ALTER TABLE ADD COLUMN` without a `NOT NULL` constraint is inherently idempotent-safe in the sense that it either succeeds or fails if the column already exists. The schema runner should wrap this in a column-existence check (via `PRAGMA table_info`) to make it fully idempotent.

**Alternatives considered**:
- New separate table for TTFT: rejected — unnecessary join complexity; TTFT is a per-run measurement like TPS
- Store TTFT in `error_message` field: rejected — semantic abuse; breaks schema contract
- Non-nullable with default 0: rejected — 0 is indistinguishable from a genuine 0ms TTFT measurement

---

## Decision 7: `tps` Column Semantics Under Streaming

**Decision**: The `tps` column stores the best available throughput estimate for every run: streaming inter-token TPS when measurable, total-latency-derived TPS otherwise (non-streaming runs, single-chunk streaming, pre-migration legacy rows). The column is never null.

**Rationale**: The TPS chart relies on a non-null `tps` for every run to avoid gaps. The semantic shift (streaming throughput vs. total-latency throughput) is acceptable because: (a) most streaming runs will have separable TTFT, making the new TPS strictly more accurate; (b) non-streaming runs retain the same value they always had. The `ttft_ms` column is the signal that distinguishes streaming from non-streaming runs.

**Alternatives considered**:
- Separate `streaming_tps` column: rejected — doubles chart logic; most runs will have only one or the other
- Make `tps` nullable for non-streaming: rejected — creates chart gaps with no benefit
