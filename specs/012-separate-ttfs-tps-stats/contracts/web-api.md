# Web API Contract: Separate TTFT and TPS Stats

**Feature**: `012-separate-ttfs-tps-stats`  
**Date**: 2026-05-11  
**Served by**: `llm-monitor-web` (`src/web/routes.ts`)

This document describes the **changes** to the existing web API. Unchanged endpoints are omitted.

---

## `GET /api/metrics`

Returns per-run data points and aggregated stats for a single configuration.

**Query parameters**: unchanged (`config`, `hours`)

### Response — changed fields

```jsonc
{
  "config": "my-endpoint",
  "hours": 48,
  "dataPoints": [
    {
      "timestamp": "2026-05-11T10:00:00.000Z",
      "tps": 42.5,          // best-available TPS (streaming throughput or total-latency-derived)
      "latencyMs": 1200,
      "httpStatus": 200,
      "ttftMs": 185         // NEW: number | null — null when not available
    }
  ],
  "stats": {
    "avgTps": 40.2,
    "p50LatencyMs": 1150,
    "p95LatencyMs": 1900,
    "successRate": 0.98,
    "tpsStdDev": 3.1,
    "p50TtftMs": 180,       // NEW: number | null — null when no TTFT data in window
    "p95TtftMs": 310        // NEW: number | null — null when no TTFT data in window
  }
}
```

**Backward compatibility**: `ttftMs` and `p50TtftMs`/`p95TtftMs` are additive fields. Existing consumers that ignore unknown fields are unaffected.

---

## `GET /api/metrics/data-points`

Returns raw per-run data points for a single configuration (detailed view / data table).

**Query parameters**: unchanged (`config`, `hours`, `limit`)

### Response — changed fields

```jsonc
{
  "config": "my-endpoint",
  "hours": 48,
  "dataPoints": [
    {
      "timestamp": "2026-05-11T10:00:00.000Z",
      "tps": 42.5,
      "latencyMs": 1200,
      "httpStatus": 200,
      "ttftMs": 185         // NEW: number | null
    }
  ]
}
```

---

## `GET /api/metrics/compare`

Returns TPS series for multiple configurations overlaid on one chart. **Unchanged** — TTFT is not included in the comparison chart view (deferred per spec Assumptions).

---

## `GET /api/configs`

Unchanged.

---

## Null Handling Rules

| Field | Null when |
|---|---|
| `ttftMs` (data point) | Run was non-streaming, or failure occurred before first chunk |
| `p50TtftMs` (stats) | No runs in the selected time window have a non-null `ttft_ms` |
| `p95TtftMs` (stats) | Same as above |
| `tps` (data point) | Never null — always carries best-available throughput estimate |

---

## UI Display Rules

| Metric | Available | Not available |
|---|---|---|
| TTFT stat tile (P50) | Show value in ms | Show "N/A" |
| TTFT stat tile (P95) | Show value in ms | Show "N/A" |
| TTFT data table cell | Show value in ms | Show "N/A" |
| TPS | Always shown | — |
