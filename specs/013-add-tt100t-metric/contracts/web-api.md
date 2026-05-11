# Web API Contract: Add TT100T Metric

**Feature**: `013-add-tt100t-metric`
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
      "tps": 42.5,
      "latencyMs": 1200,
      "httpStatus": 200,
      "ttftMs": 185,
      "tt100tMs": 2610          // NEW: number | null — null when not available
    }
  ],
  "stats": {
    "avgTps": 40.2,
    "p50LatencyMs": 1150,
    "p95LatencyMs": 1900,
    "successRate": 0.98,
    "tpsStdDev": 3.1,
    "p50TtftMs": 180,
    "p95TtftMs": 310,
    "avgTt100tMs": 2450        // NEW: number | null — null when no TT100T data in window
  }
}
```

**Backward compatibility**: `tt100tMs` and `avgTt100tMs` are additive fields. Existing consumers that ignore unknown fields are unaffected.

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
      "ttftMs": 185,
      "tt100tMs": 2610          // NEW: number | null
    }
  ]
}
```

---

## `GET /api/metrics/compare`

Unchanged — TT100T is not included in the comparison chart view (same rationale as TTFT).

---

## `GET /api/configs`

Unchanged.

---

## Null Handling Rules

| Field | Null when |
|---|---|
| `tt100tMs` (data point) | Run was non-streaming, generated <100 tokens, or failure occurred before 100 tokens |
| `avgTt100tMs` (stats) | No runs in the selected time window have a non-null `tt100t_ms` |
| `ttftMs` (data point) | Unchanged from feature 012 |
| `tps` (data point) | Never null — always carries best-available throughput estimate |

---

## UI Display Rules

| Metric | Available | Not available |
|---|---|---|
| TT100T stat tile (Avg) | Show value in ms | Show "N/A" |
| TT100T data table cell | Show value in ms | Show "N/A" |
| TTFT | Unchanged from feature 012 | — |
| TPS | Always shown | — |
