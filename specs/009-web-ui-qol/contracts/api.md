# API Contract: Web UI Quality-of-Life Improvements

## New Endpoint

### GET /api/metrics/data-points

Returns raw data points for a specific configuration, ordered newest-first.

**Request Parameters** (query string):

| Parameter | Type   | Required | Default | Description                          |
|-----------|--------|----------|---------|--------------------------------------|
| config    | string | Yes      | —       | Configuration label to query         |
| hours     | number | No       | 48      | Lookback window in hours             |
| limit     | number | No       | 50      | Maximum number of rows to return      |

**Response** (200 OK):

```json
{
  "config": "gpt-4o",
  "hours": 48,
  "dataPoints": [
    {
      "timestamp": "2026-05-09T14:30:00.000Z",
      "tps": 38.5,
      "latencyMs": 520,
      "httpStatus": 200
    }
  ]
}
```

**Error Responses**:

| Status | Condition                         | Body                              |
|--------|-----------------------------------|-----------------------------------|
| 400    | Missing `config` parameter       | `{"error": "Missing config parameter"}` |

**Notes**:
- Data points are ordered by `timestamp DESC` (newest first)
- The `limit` caps the number of rows returned
- Reuses the same `benchmark_runs` table and query pattern as the existing `/api/metrics` endpoint

## Existing Endpoints (unchanged)

- `GET /api/configs` — returns list of configuration labels
- `GET /api/metrics?config=<label>&hours=<n>` — returns metrics with stats
- `GET /api/metrics/compare?hours=<n>&configs=<labels>` — returns comparison data
