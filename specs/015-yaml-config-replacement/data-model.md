# Data Model: Replace config.ts with YAML Configuration

**Branch**: `015-yaml-config-replacement` | **Date**: 2026-05-12

## Entity: YAML Config File (`config.yaml`)

The YAML configuration file is the primary configuration artifact. It maps 1:1 to the existing `AppConfig` TypeScript interface.

### Structure

```yaml
bench:
  schedule: string          # Cron expression, REQUIRED
  endpoints:                 # Array of EndpointConfig, REQUIRED, min 1
    - label: string         # Unique identifier, REQUIRED
      baseUrl: string       # OpenAI-compatible API base URL, REQUIRED
      apiKeyEnvVar: string  # Environment variable name holding API key, REQUIRED
      model: string         # Model identifier, REQUIRED
      promptTemplate: string   # Optional, default: "Explain the water cycle..."
      temperature: number     # Optional, 0–2, default: 0
      maxTokens: number       # Optional, default: 1024
      timeoutMs: number       # Optional, default: 30000
      streaming: boolean       # Optional, default: false

web:
  port: number              # Optional, default: 3000
  host: string              # Optional, default: "127.0.0.1"

db:
  path: string              # Optional, default: "./data/llm-monitor.db"
  retentionDays: number     # Optional, min 1, default: 30
```

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `bench.schedule` | Required, non-empty | "bench.schedule is required" |
| `bench.endpoints` | Required, non-empty array | At least one endpoint required |
| `endpoint.label` | Required, unique across endpoints | "Each endpoint must have a label" / "Duplicate endpoint label: {label}" |
| `endpoint.baseUrl` | Required, non-empty | "Endpoint \"{label}\": baseUrl is required" |
| `endpoint.apiKeyEnvVar` | Required, non-empty | "Endpoint \"{label}\": apiKeyEnvVar is required" |
| `endpoint.model` | Required, non-empty | "Endpoint \"{label}\": model is required" |
| `endpoint.temperature` | If present, must be 0–2 | "Endpoint \"{label}\": temperature must be in [0, 2]" |
| `db.retentionDays` | If present, must be ≥ 1 | "db.retentionDays must be >= 1" |

### Defaults

| Field | Default Value |
|-------|--------------|
| `endpoint.promptTemplate` | "Explain the water cycle in a few paragraphs." |
| `endpoint.temperature` | 0 |
| `endpoint.maxTokens` | 1024 |
| `endpoint.timeoutMs` | 30000 |
| `web.port` | 3000 |
| `web.host` | "127.0.0.1" |
| `db.path` | "./data/llm-monitor.db" |
| `db.retentionDays` | 30 |

## Entity: Environment Variables

Environment variables hold API keys and are referenced by name in the YAML config via `apiKeyEnvVar`. They are resolved at runtime by `resolveApiKeys()`.

| Variable | Purpose | Example |
|----------|---------|---------|
| `{apiKeyEnvVar}` | API key for an endpoint | `OPENAI_API_KEY=sk-...` |
| `CONFIG_PATH` | Override path to YAML config file | `CONFIG_PATH=/etc/llm-monitor/config.yaml` |

### Resolution Rules

- If the referenced environment variable is not set or empty, the application MUST fail with: "Environment variable \"{varName}\" is not set or empty (required by endpoint \"{label}\")"
- Resolution happens after YAML parsing and validation, in the bench process only (web process does not need API keys)

## Entity: Example Files

### `config.example.yaml`

Template YAML file committed to the repository. Contains:
- All available configuration options with placeholder/example values
- Inline YAML comments (`#`) documenting each field, its purpose, and default value
- Two example endpoints (matching the current `config.example.ts`)

### `.env.example`

Template environment file committed to the repository. Contains:
- All environment variable names referenced in `config.example.yaml`
- Placeholder values showing the expected format
- Inline comments documenting each variable

## Entity: Config Loader Module (`src/shared/config.ts` — modified)

The existing `loadConfig()` function is replaced. The new module exports:

| Function | Signature | Purpose |
|----------|-----------|---------|
| `loadConfigFromYaml()` | `() => AppConfig` | Reads `config.yaml` (or `CONFIG_PATH`), parses with `Bun.YAML.parse()`, validates, applies defaults, returns `AppConfig` |
| `resolveApiKeys()` | `(endpoints: EndpointConfig[]) => ResolvedEndpoint[]` | Unchanged — reads `process.env[apiKeyEnvVar]` for each endpoint |

The existing `loadConfig(raw: AppConfig)` function is removed since the YAML file is the only config source.

## Relationships

```
config.yaml ──parsed-by──► Bun.YAML.parse() ──validated-by──► loadConfigFromYaml()
                                                                      │
                                                                      ▼
                                                              AppConfig (typed object)
                                                                      │
                    ┌─────────────────────────────────────────────────┤
                    │                                                 │
                    ▼                                                 ▼
           bench process                                        web process
           resolves API keys via                               uses config for
           resolveApiKeys()                                    port/host/db settings
                    │
                    ▼
           ResolvedEndpoint[]
           (with apiKey from env)
```

## State Transitions

Config loading follows a linear pipeline with early-exit on failure:

```
[No file] ──► Error: "config.yaml not found. Copy config.example.yaml..."
     │
[File exists] ──► Read file ──► [Parse error] ──► Error: "Failed to parse config.yaml: {details}"
     │
[Valid YAML] ──► Validate ──► [Missing/invalid fields] ──► Error: "{specific validation message}"
     │
[Valid config] ──► Apply defaults ──► Return AppConfig
     │
     └──► (bench only) Resolve API keys ──► [Missing env var] ──► Error: "Environment variable not set..."
                                    │
                                    └──► Return ResolvedEndpoint[]
```
