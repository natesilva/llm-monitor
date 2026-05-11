# Data Model: Separate TTFT and TPS Stats

**Feature**: `012-separate-ttfs-tps-stats`  
**Date**: 2026-05-11

## Database Schema Changes

### Migration 0002: Add ttft_ms column

File: `src/db/migrations/0002_add_ttft.sql`

```sql
-- Idempotent: check column existence via PRAGMA before adding
-- Applied by schema.ts migration runner at startup
ALTER TABLE benchmark_runs ADD COLUMN ttft_ms REAL;
```

SQLite sets existing rows to `NULL` automatically. The column is nullable — `NULL` indicates the run was non-streaming or that no first token was received before failure.

### Updated `benchmark_runs` Schema

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | INTEGER PK | No | Auto-increment |
| `config_label` | TEXT | No | Endpoint label from config |
| `model` | TEXT | No | Model name returned by endpoint |
| `timestamp` | TEXT | No | ISO 8601 run timestamp |
| `prompt_tokens` | INTEGER | No | Input token count |
| `comp_tokens` | INTEGER | No | Output token count |
| `total_tokens` | INTEGER | No | prompt + completion tokens |
| `latency_ms` | INTEGER | No | Total wall-clock time (ms), unchanged |
| `tps` | REAL | No | Best-available throughput: streaming inter-token rate when measurable, total-latency-derived rate otherwise; 0 for zero-completion-token runs |
| `http_status` | INTEGER | No | HTTP response status |
| `error_message` | TEXT | Yes | Error description if run failed |
| `ttft_ms` | REAL | **Yes** | **NEW** Time-to-first-token (ms); NULL for non-streaming runs or if no chunk was received |

---

## TypeScript Type Changes

### `src/shared/types.ts`

#### `EndpointConfig` — add `streaming` field

```typescript
export interface EndpointConfig {
  label: string;
  baseUrl: string;
  apiKeyEnvVar: string;
  model: string;
  promptTemplate?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  streaming?: boolean;   // NEW: default true; set false to use non-streaming fallback
}
```

#### `BenchmarkRun` — add `timeToFirstTokenMs` field

```typescript
export interface BenchmarkRun {
  id?: number;
  configLabel: string;
  model: string;
  timestamp: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  tokensPerSecond: number;        // best-available TPS (streaming or total-latency-derived)
  httpStatus: number;
  errorMessage?: string;
  timeToFirstTokenMs: number | null;  // NEW: null for non-streaming or pre-first-chunk failure
}
```

#### `MetricsDataPoint` — add `ttftMs` field

```typescript
export interface MetricsDataPoint {
  timestamp: string;
  tps: number;
  latencyMs: number;
  httpStatus: number;
  ttftMs: number | null;   // NEW: null when not available
}
```

#### `ConfigStats` — add TTFT percentile fields

```typescript
export interface ConfigStats {
  avgTps: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  successRate: number;
  tpsStdDev: number;
  p50TtftMs: number | null;   // NEW: null when no runs in window have TTFT data
  p95TtftMs: number | null;   // NEW: null when no runs in window have TTFT data
}
```

---

## Validation Rules

- `ttft_ms` MUST be non-negative when present (0 is valid).
- `ttft_ms` MUST be less than or equal to `latency_ms` (first token cannot arrive after total response time).
- `tps` MUST be non-null and non-negative for every row (enforced at insert time; single-chunk and non-streaming runs use total-latency-derived value; zero-completion-token runs store 0).
- When `ttft_ms` is NULL and `tps` was derived from total latency, there is no way to distinguish them from legacy rows — this is acceptable since the behavior is the same.

---

## State / Lifecycle

A `BenchmarkRun` row is immutable after insert. There are no updates or state transitions — the pruning job deletes rows older than `retentionDays` in bulk.

The `streaming` field on `EndpointConfig` is a configuration concern, not persisted to the database. Its value at run time determines which code path populates `ttft_ms`.
