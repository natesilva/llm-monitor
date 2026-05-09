# Quickstart: Cache-Bust Request User

## Prerequisites

- Bun runtime installed
- `config.ts` configured with at least one endpoint

## Setup

No setup required. The cache-busting `user` field is generated automatically.

## Verification

```bash
# 1. Run a benchmark
bun run bench

# 2. Check logs — each request now includes a unique user value
# Expected output per endpoint:
#   [OpenAI GPT-4o] Running benchmark...
#   [OpenAI GPT-4o] OK — 45.2 TPS, 1203ms, 54 tokens

# 3. Run a second benchmark and compare latency values
# Consecutive runs should show naturally varying latencies,
# not identical cached responses
bun run bench

# 4. Verify typecheck still passes
bun run typecheck
```

## What Changed

- **`src/bench/runner.ts`**: Added `user: crypto.randomUUID()` to the request body sent to inference servers. This ensures each request is treated as a unique interaction, preventing cached responses.
