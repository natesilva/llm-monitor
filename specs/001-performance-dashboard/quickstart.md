# Quickstart: LLM Performance Monitor

## Prerequisites

- [Bun](https://bun.sh) v1.2 or later
- An API key for at least one OpenAI-compatible provider

## Setup

```bash
# Clone and enter the project
cd llm-monitor

# Install dependencies (Chart.js for the dashboard)
bun install

# Copy the example config
cp config.example.ts config.ts
```

## Configuration

Edit `config.ts` to add your endpoints:

```typescript
export default {
  bench: {
    schedule: "0 * * * *", // Run every hour
    endpoints: [
      {
        label: "OpenAI GPT-4o",
        baseUrl: "https://api.openai.com",
        apiKeyEnvVar: "OPENAI_API_KEY",
        model: "gpt-4o",
      },
    ],
  },
  web: {
    port: 3000,
    host: "127.0.0.1",
  },
  db: {
    path: "./data/llm-monitor.db",
    retentionDays: 30,
  },
};
```

Set your API key as an environment variable (Bun loads `.env` automatically):

```bash
export OPENAI_API_KEY="sk-..."
```

## Running

### Register the scheduled benchmark job

```bash
bun run bench:setup
```

This registers an OS-level cron job via `Bun.cron()` that runs the benchmark
on the configured schedule. The bench script itself is one-shot: it runs all
endpoints, records results, and exits. No long-running process needed.

### Run benchmarks manually (one-shot)

```bash
bun run bench
```

This runs all configured endpoints once, records results, and exits. Useful
for testing or an immediate run outside the schedule.

### Start the web dashboard

```bash
bun run web
```

Open http://127.0.0.1:3000 in your browser. The dashboard shows data once
the scheduler completes its first benchmark run. Auto-refreshes every 60
seconds.

## Development

```bash
# Run tests
bun test

# Type-check
bun run typecheck

# Format code
bun run fmt
```
