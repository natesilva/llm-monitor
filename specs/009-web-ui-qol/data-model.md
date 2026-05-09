# Data Model: Web UI Quality-of-Life Improvements

## Existing Entities (unchanged)

### benchmark_runs

| Column          | Type    | Description                          |
|-----------------|---------|--------------------------------------|
| id              | INTEGER | Primary key, auto-increment          |
| config_label    | TEXT    | Endpoint configuration label         |
| model           | TEXT    | Model name                           |
| timestamp       | TEXT    | ISO 8601 timestamp of the run        |
| prompt_tokens   | INTEGER | Tokens in the prompt                 |
| comp_tokens     | INTEGER | Tokens in the completion             |
| total_tokens    | INTEGER | Total tokens (prompt + completion)   |
| latency_ms      | INTEGER | Response latency in milliseconds     |
| tps             | REAL    | Tokens per second                    |
| http_status     | INTEGER | HTTP status code                     |
| error_message   | TEXT    | Error message (nullable)             |

**No schema changes required.** The overlay reads the same `benchmark_runs` data through a new query.

## New Client-Side Entities

### Theme Preference

| Field  | Type   | Values          | Description                                |
|--------|--------|-----------------|--------------------------------------------|
| mode   | string | "auto", "dark", "light" | User's selected display mode     |
| source | string | derived         | "system" (when auto) or "user" (when manual) |

- Stored in `localStorage` under key `"theme"`
- When `"auto"`, effective theme derived from `prefers-color-scheme` media query
- Applied to DOM via `data-theme` attribute on `<html>` element

### Data Point Overlay State

| Field       | Type    | Description                                  |
|-------------|---------|----------------------------------------------|
| open        | boolean | Whether the overlay is currently visible     |
| configLabel | string  | Which configuration's data is displayed      |
| dataPoints  | array   | Fetched data points for the table            |

- Managed in JavaScript; no persistence needed
- Single `<dialog>` element reused for all configurations
