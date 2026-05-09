# Quickstart: Bench Debug Flag

## Prerequisites

- Bun runtime installed
- `config.ts` configured with at least one endpoint

## Usage

```bash
# Normal run (no debug output)
bun run bench

# Debug run (shows request and response for each endpoint)
bun run bench --debug
```

## What You'll See

With `--debug`:

```
[OpenAI GPT-4o] Running benchmark...
[OpenAI GPT-4o] Request: {"model":"gpt-4o","messages":[...],"temperature":0,"max_tokens":100,"user":"a1b2c3d4-..."}
[OpenAI GPT-4o] Response: {"id":"chatcmpl-...","model":"gpt-4o","usage":{"prompt_tokens":10,"completion_tokens":100,...},...}
[OpenAI GPT-4o] OK — 45.2 TPS, 1203ms, 100 tokens
```

Without `--debug` (unchanged from current behavior):

```
[OpenAI GPT-4o] Running benchmark...
[OpenAI GPT-4o] OK — 45.2 TPS, 1203ms, 100 tokens
```

## Verification

```bash
# 1. Run without flag — should match current output
bun run bench

# 2. Run with flag — should show request/response details
bun run bench --debug

# 3. Verify typecheck passes
bun run typecheck
```
