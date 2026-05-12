## Context

The current `loadConfigFromYaml()` in `src/shared/config.ts` manually reads the YAML config file as text via `Bun.file()` and `file.text()`, then parses it with `Bun.YAML.parse()`. This is a 3-step process where Bun's runtime already handles YAML import natively — a dynamic `import()` of a `.yaml` file automatically reads and parses the file, returning the resulting object.

## Goals / Non-Goals

**Goals:**
- Replace `Bun.YAML.parse()` with `import()` for loading the YAML config file
- Simplify `loadConfigFromYaml()` by removing manual file I/O and parse error handling
- Preserve all existing behavior: defaults, validation, env var config path

**Non-Goals:**
- Changing the YAML file format or structure
- Changing how API keys are resolved (env var lookup)
- Adding type-safe YAML validation beyond what already exists
- Modifying entry points or the `resolveApiKeys()` function

## Decisions

### 1. Use dynamic `import()` instead of `Bun.YAML.parse()`

`import(CONFIG_PATH)` returns the parsed YAML object directly. Bun natively supports importing `.yaml` files — no plugins or config needed.

**Alternative considered**: Keep `Bun.YAML.parse()` — adds unnecessary boilerplate (file read + text parse + error handling for each step) when Bun already does this via import.

### 2. Access the default export from import result

Bun imports YAML files as ES modules where the parsed object is the default export. The function will destructure `{ default }` from the import result.

### 3. Preserve `CONFIG_PATH` env var support

Dynamic `import()` works with variable paths in Bun, so `CONFIG_PATH` env var override continues to function.

### 4. Simplify error handling

File-not-found and parse errors are both raised by `import()` automatically. The function catches import errors and re-throws with a user-friendly message, matching current behavior.

## Risks / Trade-offs

- [Dynamic `import()` with variable paths may resolve differently than expected] → `CONFIG_PATH` defaults to `config.yaml` (relative to cwd), same as current behavior. Bun resolves dynamic imports relative to cwd for non-absolute paths.
- [Import result structure may change across Bun versions] → Bun has stable YAML import support since v1.0; this is a well-documented feature.
- [Less granular error messages (can't distinguish read vs parse failure)] → Acceptable tradeoff — both result in the same user action: fix the config file.
