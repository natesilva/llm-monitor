# Database Contract: LLM Monitor

## Connection

SQLite database via Bun's built-in `Database` class.

```typescript
import { Database } from "bun";

const db = new Database("./data/llm-monitor.db");
```

## Schema

See [data-model.md](../data-model.md) for the full schema. The database
contains a single table: `benchmark_runs`.

## Migrations

Migrations are versioned SQL files in `src/db/migrations/`. Each migration
is a sequential file named `NNNN_description.sql`.

**Migration 0001**:
```sql
CREATE TABLE IF NOT EXISTS benchmark_runs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    config_label  TEXT    NOT NULL,
    model         TEXT    NOT NULL,
    timestamp     TEXT    NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    comp_tokens   INTEGER NOT NULL,
    total_tokens  INTEGER NOT NULL,
    latency_ms    INTEGER NOT NULL,
    tps           REAL    NOT NULL,
    http_status   INTEGER NOT NULL,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_runs_config_timestamp
    ON benchmark_runs(config_label, timestamp);

CREATE INDEX IF NOT EXISTS idx_runs_timestamp
    ON benchmark_runs(timestamp);
```

## Access

Both the bench process and the web process open the same database file.
Bun.sqlite supports concurrent readers; writes use WAL mode for better
concurrency.

```sql
PRAGMA journal_mode = WAL;
```
