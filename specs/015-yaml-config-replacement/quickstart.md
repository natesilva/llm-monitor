# Quickstart: YAML Configuration

**Branch**: `015-yaml-config-replacement` | **Date**: 2026-05-12

## Setup

### 1. Create your configuration file

```bash
cp config.example.yaml config.yaml
```

Edit `config.yaml` to define your endpoints:

```yaml
bench:
  schedule: "0 * * * *"  # Every hour
  endpoints:
    - label: "OpenAI GPT-4o"
      baseUrl: "https://api.openai.com/v1"
      apiKeyEnvVar: OPENAI_API_KEY
      model: "gpt-4o"
```

### 2. Set your API keys

```bash
cp .env.example .env
```

Edit `.env` with your actual API keys:

```
OPENAI_API_KEY=sk-your-key-here
```

### 3. Run the application

```bash
# Run a benchmark
bun run bench

# Start the web dashboard
bun run web

# Register the cron job
bun run cron register
```

## Configuration Reference

### File Location

- Default: `config.yaml` in the project root
- Override: Set `CONFIG_PATH` environment variable to a different path

### Required Fields

- `bench.schedule` — Cron expression for benchmark scheduling
- `bench.endpoints` — Array of endpoint definitions (at least one)
  - `label` — Unique name for this endpoint
  - `baseUrl` — OpenAI-compatible API base URL
  - `apiKeyEnvVar` — Name of the environment variable holding the API key
  - `model` — Model identifier

### Optional Fields (with defaults)

- `endpoint.promptTemplate` — Prompt text sent to the endpoint (default: "Explain the water cycle in a few paragraphs.")
- `endpoint.temperature` — Sampling temperature, 0–2 (default: 0)
- `endpoint.maxTokens` — Maximum tokens in response (default: 1024)
- `endpoint.timeoutMs` — Request timeout in milliseconds (default: 30000)
- `endpoint.streaming` — Whether to use SSE streaming (default: false)
- `web.port` — Web dashboard port (default: 3000)
- `web.host` — Web dashboard host (default: "127.0.0.1")
- `db.path` — SQLite database file path (default: "./data/llm-monitor.db")
- `db.retentionDays` — Days to keep benchmark data (default: 30)

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| "config.yaml not found" | No config file at expected path | Copy `config.example.yaml` to `config.yaml` |
| "Failed to parse config.yaml" | YAML syntax error | Check indentation and syntax in your config file |
| "bench.schedule is required" | Missing required field | Add `schedule` under `bench` section |
| "Environment variable not set" | API key env var missing or empty | Set the variable in your `.env` file or shell |
| "Duplicate endpoint label" | Two endpoints with same `label` | Give each endpoint a unique label |
