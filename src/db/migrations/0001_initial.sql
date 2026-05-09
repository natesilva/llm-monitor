PRAGMA journal_mode = WAL;

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
