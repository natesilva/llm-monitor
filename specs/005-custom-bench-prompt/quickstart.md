# Quickstart: Custom Bench Prompt

**Date**: 2026-05-08
**Feature**: Add --prompt CLI flag to bench runner

## Prerequisites

- Working `config.ts` (copy from `config.example.ts`)
- At least one API key set in environment variables

## Usage

### Default prompt (no flag)

```sh
bun run bench
```

Sends "What is photosynthesis? Give a brief overview." to each endpoint.

### Custom prompt

```sh
bun run bench --prompt "Explain quantum computing in one paragraph"
```

Sends the specified text to each endpoint, overriding any per-endpoint `promptTemplate` in config.

### Combined with --debug

```sh
bun run bench --debug --prompt "Write a haiku about servers"
```

Sends the custom prompt and prints full request/response details.

### Help

```sh
bun run bench --help
```

Lists all available flags including `--prompt`.

## Verification

1. Run `bun run bench` — default prompt is sent
2. Run `bun run bench --prompt "test"` — "test" is sent as the user message
3. Run `bun run bench --debug --prompt "test"` — request body shows `"content": "test"`
