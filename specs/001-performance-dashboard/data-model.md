# Data Model: LLM Performance Dashboard

## Entities

### Configuration

A tested provider/model combination defined externally in the config file.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | yes | Human-readable name (e.g., "OpenAI GPT-4o") |
| `baseUrl` | string | yes | OpenAI-compatible endpoint URL |
| `apiKeyEnvVar` | string | yes | Environment variable name holding the API key |
| `model` | string | yes | Model identifier (e.g., "gpt-4o") |
| `promptTemplate` | string | no | Prompt to send; defaults to a standard short prompt |
| `temperature` | number | no | Sampling temperature (default: 0) |
| `maxTokens` | number | no | Max completion tokens (default: 100) |
| `timeoutMs` | number | no | Request timeout (default: 30000) |

**Validation rules**:
- `label` must be unique across all configurations
- `baseUrl` must be a valid URL
- `apiKeyEnvVar` must reference a non-empty environment variable at runtime
- `model` must be non-empty
- Temperature must be in [0, 2] range

**State transitions**: Configuration set is read from config on startup and
re-read each schedule cycle. Configurations can be added/removed without
restarting the bench process.

---

### BenchmarkRun

A single execution of a prompt against one Configuration.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer (auto) | yes | Primary key |
| `configLabel` | string | yes | Which configuration was tested |
| `model` | string | yes | Model name returned by the API |
| `timestamp` | datetime | yes | When the run completed |
| `promptTokens` | integer | yes | Token count of the prompt |
| `completionTokens` | integer | yes | Token count of the completion |
| `totalTokens` | integer | yes | promptTokens + completionTokens |
| `latencyMs` | integer | yes | Wall-clock time in milliseconds |
| `tokensPerSecond` | real | yes | completionTokens / (latencyMs / 1000) |
| `httpStatus` | integer | yes | HTTP response status code |
| `errorMessage` | string | no | Error detail if the run failed |

**Validation rules**:
- `tokensPerSecond` must be >= 0
- `latencyMs` must be > 0 for successful runs
- `httpStatus` 2xx = success, anything else = failure
- `errorMessage` MUST be present if httpStatus is not 2xx

**State transitions**: Runs are insert-only (never updated or deleted by the
application). Data may be pruned by a retention policy (auto-delete rows older
than N days).

---

### Relationships

```
Configuration (1) ────< BenchmarkRun (many)
  via configLabel
```

- A Configuration defines the parameters for testing.
- A BenchmarkRun records one result for a Configuration.
- No other entities exist. The data model is intentionally minimal.

---

## Database Schema (SQLite)

```sql
CREATE TABLE benchmark_runs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    config_label  TEXT    NOT NULL,
    model         TEXT    NOT NULL,
    timestamp     TEXT    NOT NULL,  -- ISO 8601
    prompt_tokens INTEGER NOT NULL,
    comp_tokens   INTEGER NOT NULL,
    total_tokens  INTEGER NOT NULL,
    latency_ms    INTEGER NOT NULL,
    tps           REAL    NOT NULL,
    http_status   INTEGER NOT NULL,
    error_message TEXT,
    FOREIGN KEY (config_label) REFERENCES configurations(label)
);

-- Index for common query patterns
CREATE INDEX idx_runs_config_timestamp ON benchmark_runs(config_label, timestamp);
CREATE INDEX idx_runs_timestamp ON benchmark_runs(timestamp);
```

Note: `configurations` table is not a persistent table — it is derived from
the config file at runtime. The foreign key is a logical constraint enforced
by application logic, not by SQLite.

---

## Query Patterns

| Purpose | Query |
|---------|-------|
| TPS graph for one config (48h) | `SELECT timestamp, tps FROM benchmark_runs WHERE config_label = ? AND timestamp >= datetime('now', '-48 hours') ORDER BY timestamp` |
| Stats for one config (48h) | `SELECT AVG(tps), AVG(latency_ms), success_rate FROM benchmark_runs WHERE config_label = ? AND timestamp >= datetime('now', '-48 hours')` |
| Comparison graph (24h, all) | `SELECT config_label, timestamp, tps FROM benchmark_runs WHERE timestamp >= datetime('now', '-24 hours') ORDER BY config_label, timestamp` |
| Distinct configs with data | `SELECT DISTINCT config_label FROM benchmark_runs` |
| Prune old data | `DELETE FROM benchmark_runs WHERE timestamp < datetime('now', '-N days')` |
