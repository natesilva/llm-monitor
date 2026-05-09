# LLM Monitor

Benchmark LLM API endpoints on a schedule and monitor latency, throughput, and availability from a web dashboard.

## Features

- **Scheduled benchmarking** — run prompts against any OpenAI-compatible API on a cron schedule
- **Metrics dashboard** — real-time web UI with per-configuration charts and a 24-hour comparison view
- **Persistent storage** — SQLite-backed metrics with configurable retention
- **OpenAI-API compatible** — works with any endpoint that speaks the OpenAI chat completions API

## Prerequisites

- [Bun](https://bun.sh/) v1.3+

## Installation

```bash
git clone <repo-url> llm-monitor
cd llm-monitor
bun install
cp config.example.ts config.ts
```

Edit `config.ts` to set your endpoints, schedule, and API keys.

Set the environment variables referenced in your config (e.g. `OPENAI_API_KEY`):

```bash
export OPENAI_API_KEY=sk-...
```

You can also create a `.env` file in the project root — the cron worker loads it automatically.

## Usage

### Run a benchmark

```bash
bun run bench
```

Sends one request per configured endpoint and records the results.

### Schedule benchmarks

```bash
# Register the cron job (uses the schedule from config.ts)
bun run cron register

# Check registration status
bun run cron status

# Remove the cron job
bun run cron unregister
```

On macOS, Bun registers a launchd agent. On Linux, it adds an entry to crontab.

Cron logs are written to:

- `/tmp/bun.cron.LLM_Monitor_Bench.stdout.log`
- `/tmp/bun.cron.LLM_Monitor_Bench.stderr.log`

### Web dashboard

```bash
# Start the dashboard
bun run web

# Start with hot-reload (development)
bun run web:dev
```

Open `http://127.0.0.1:3000` (or the host/port from your config).

The dashboard auto-refreshes every 60 seconds. Each configured endpoint gets its own tile showing throughput (tokens/sec), latency (p50/p95), and success rate over the last 48 hours. The comparison chart overlays selected endpoints over the last 24 hours.

## Configuration

Configuration lives in `config.ts` at the project root. Start from the included example:

```bash
cp config.example.ts config.ts
```

Key fields:

| Field | Description |
|-------|-------------|
| `bench.schedule` | Cron expression for scheduled runs (default: `"0 * * * *"`, hourly) |
| `bench.endpoints` | Array of endpoint configs (label, baseUrl, model, apiKeyEnvVar) |
| `web.port` | Dashboard port (default: `3000`) |
| `web.host` | Dashboard host (default: `"127.0.0.1"`) |
| `db.path` | SQLite database path (default: `"./data/llm-monitor.db"`) |
| `db.retentionDays` | Days to keep metrics (default: `30`) |

See `config.example.ts` for a complete example.

## License

[MIT](./LICENSE)
