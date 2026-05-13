# LLM Monitor

Benchmark LLM API endpoints on a schedule and monitor latency, throughput, and availability from a web dashboard.

## Features

- **Scheduled benchmarking** — run prompts against any OpenAI-compatible API on a cron schedule
- **Metrics dashboard** — real-time web UI with per-configuration charts, error visibility, and a 24-hour comparison view
- **Persistent storage** — SQLite-backed metrics with configurable retention
- **OpenAI-API compatible** — works with any endpoint that speaks the OpenAI chat completions API

## Prerequisites

- [Bun](https://bun.sh/) v1.3+

## Installation

```bash
git clone <repo-url> llm-monitor
cd llm-monitor
bun install
cp config.example.yaml config.yaml
```

Edit `config.yaml` to set your endpoints, schedule, and API keys.

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
# Register the cron job (uses the schedule from config.yaml)
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

The dashboard auto-refreshes every 60 seconds. Each configured endpoint gets its own tile showing throughput (tokens/sec), latency (p50/p95), and success rate over the last 48 hours. Error data points appear as red markers with tooltips showing the error message. The comparison chart overlays selected endpoints over the last 24 hours with error markers visible on the timeline. The dashboard supports dark and light themes.

## Configuration

Configuration lives in `config.yaml` at the project root. Start from the included example:

```bash
cp config.example.yaml config.yaml
```

Key fields:

| Field | Description |
|-------|-------------|
| `bench.schedule` | Cron expression for scheduled runs (default: `"0 * * * *"`, hourly) |
| `bench.endpoints` | Array of endpoint configs (label, baseUrl, model, apiKeyEnvVar, streaming) |
| `web.port` | Dashboard port (default: `3000`) |
| `web.host` | Dashboard host (default: `"127.0.0.1"`) |
| `db.path` | SQLite database path (default: `"./data/llm-monitor.db"`) |
| `db.retentionDays` | Days to keep metrics (default: `30`) |

See `config.example.yaml` for a complete example.

## License

[MIT](./LICENSE)
