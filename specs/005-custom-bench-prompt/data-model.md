# Data Model: Custom Bench Prompt

**Date**: 2026-05-08
**Feature**: Add --prompt CLI flag to bench runner

## Entities

No new entities. No schema changes. The feature only modifies the in-flight request body construction.

## Affected Data Flows

| Flow | Change |
|------|--------|
| CLI → index.ts | New `prompt` string parameter from `util.parseArgs` |
| index.ts → scheduler.ts | `runAllEndpoints(db, endpoints, debug, prompt?)` — new 4th parameter |
| scheduler.ts → runner.ts | `runEndpoint(db, endpoint, debug, prompt?)` — new 4th parameter |
| runner.ts → API request | `body.messages[0].content` uses `prompt ?? endpoint.promptTemplate` |
| config.ts defaults | `DEFAULTS.promptTemplate` changes to new value |

## Validation Rules

- `--prompt` is a string type; `util.parseArgs` enforces a value must follow the flag
- Empty string is valid (user explicitly chose it)
- No length limit enforced client-side; API will reject if exceeded
