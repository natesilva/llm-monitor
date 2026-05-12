## Why

Bun natively supports importing `.yaml` files — `import` automatically reads and parses them. The current `loadConfigFromYaml()` manually reads the file as text and calls `Bun.YAML.parse()`, which is redundant boilerplate. Using `import` simplifies the code, removes manual file I/O and error handling, and aligns with Bun's idiomatic YAML consumption pattern.

## What Changes

- Replace `Bun.YAML.parse(text)` with a dynamic `import(CONFIG_PATH)` in `loadConfigFromYaml()`
- Remove manual `Bun.file()` / `file.text()` / `Bun.YAML.parse()` calls and their associated error handling
- The `import()` returns the parsed YAML object directly, so the function just applies defaults and validates

## Capabilities

### New Capabilities

- `yaml-import-loading`: Config loading via native Bun YAML import instead of manual parse

### Modified Capabilities

## Impact

- `src/shared/config.ts`: `loadConfigFromYaml()` rewritten to use `import()` instead of `Bun.YAML.parse()`
- Entry points (`src/bench/index.ts`, `src/bench/cron.ts`, `src/web/index.ts`): No changes needed — they already call `loadConfigFromYaml()`
- No new dependencies; removes reliance on `Bun.YAML` API in favor of native import
