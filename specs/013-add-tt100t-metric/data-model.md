# Data Model: Add TT100T Metric

**Feature**: `013-add-tt100t-metric`
**Date**: 2026-05-11

## Database Schema Changes

### Migration 0003: Add tt100t_ms column

File: `src/db/migrations/0003_add_tt100t.sql`

```sql
ALTER TABLE benchmark_runs ADD COLUMN tt100t_ms INTEGER;
```

SQLite sets existing rows to `NULL` automatically. The column is nullable — `NULL` indicates the run was non-streaming, generated fewer than 100 tokens, or is a pre-migration legacy row. The migration runner (`schema.ts`) applies SQL files in order and tracks applied migrations in `_migrations`, so this is idempotent.

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
| `latency_ms` | INTEGER | No | Total wall-clock time (ms) |
| `tps` | REAL | No | Best-available throughput |
| `http_status` | INTEGER | No | HTTP response status |
| `error_message` | TEXT | Yes | Error description if run failed |
| `ttft_ms` | REAL | Yes | Time-to-first-token (ms); NULL for non-streaming |
| `tt100t_ms` | INTEGER | **Yes** | **NEW** Time-to-first-100-tokens (ms); NULL for non-streaming or <100 tokens |

---

## TypeScript Type Changes

### `src/shared/types.ts`

#### `BenchmarkRun` — add `timeToFirst100TokensMs` field

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
  tokensPerSecond: number;
  timeToFirstTokenMs: number | null;
  timeToFirst100TokensMs: number | null;  // NEW: null when <100 tokens or non-streaming
  httpStatus: number;
  errorMessage?: string;
}
```

#### `MetricsDataPoint` — add `tt100tMs` field

```typescript
export interface MetricsDataPoint {
  timestamp: string;
  tps: number;
  latencyMs: number;
  httpStatus: number;
  ttftMs: number | null;
  tt100tMs: number | null;   // NEW: null when not available
}
```

#### `ConfigStats` — add `avgTt100tMs` field

```typescript
export interface ConfigStats {
  avgTps: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  successRate: number;
  tpsStdDev: number;
  p50TtftMs: number | null;
  p95TtftMs: number | null;
  avgTt100tMs: number | null;   // NEW: null when no runs in window have TT100T data
}
```

---

## Validation Rules

### Naming Convention

| Context | Name | Example |
|---|---|---|
| SQLite column | snake_case | `tt100t_ms` |
| TypeScript interface (BenchmarkRun) | camelCase descriptive | `timeToFirst100TokensMs` |
| TypeScript interface (MetricsDataPoint, API JSON) | camelCase abbreviated | `tt100tMs` |
| TypeScript interface (ConfigStats, API JSON) | camelCase prefixed | `avgTt100tMs` |
| Console log / UI label | Uppercase abbreviation | `TT100T` |

This mirrors the existing TTFT convention: `ttft_ms` → `timeToFirstTokenMs` → `ttftMs` → `avgTtftMs`.

###

- `tt100t_ms` MUST be non-negative when present (0 is valid but extremely unlikely).
- `tt100t_ms` MUST be greater than or equal to `ttft_ms` when both are non-null (100 tokens cannot arrive before the first token).
- `tt100t_ms` MUST be less than or equal to `latency_ms` (100 tokens cannot arrive after total response time).
- When `tt100t_ms` is NULL and `ttft_ms` is non-NULL, the run generated fewer than 100 tokens — this is a valid state.
- When `ttft_ms` is NULL, `tt100t_ms` MUST also be NULL (non-streaming runs have no per-token timing).

---

## State / Lifecycle

A `BenchmarkRun` row is immutable after insert. There are no updates or state transitions — the pruning job deletes rows older than `retentionDays` in bulk.

The `tt100t_ms` value is determined at run time by the streaming loop's cumulative token counter. It is not computable from `ttft_ms` and `tps` alone (provider batching means the relationship is non-linear).
