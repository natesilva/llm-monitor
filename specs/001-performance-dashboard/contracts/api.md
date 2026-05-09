# API Contracts: LLM Performance Dashboard

## Web Dashboard HTTP API

The web server exposes two API endpoints consumed by the frontend dashboard
JavaScript. All responses are JSON.

### GET /api/configs

Returns the list of configurations that have benchmark data.

**Response**:
```json
{
  "configs": ["OpenAI GPT-4o", "Anthropic Claude 3.5 Sonnet"]
}
```

**Status codes**: 200

---

### GET /api/metrics?config=<label>&hours=48

Returns benchmark metrics for a single configuration.

**Query params**:
- `config` (required): Configuration label
- `hours` (optional, default: 48): Time window in hours

**Response**:
```json
{
  "config": "OpenAI GPT-4o",
  "hours": 48,
  "dataPoints": [
    {
      "timestamp": "2026-05-07T14:00:00Z",
      "tps": 85.3,
      "latencyMs": 1200,
      "httpStatus": 200
    }
  ],
  "stats": {
    "avgTps": 82.1,
    "p50LatencyMs": 1150,
    "p95LatencyMs": 2100,
    "successRate": 0.98,
    "tpsStdDev": 5.2
  }
}
```

**Status codes**: 200 (data found), 404 (unknown config)

---

### GET /api/metrics/compare?hours=24&configs=label1,label2,...

Returns time-series data for multiple configurations for the comparison graph.

**Query params**:
- `hours` (optional, default: 24): Time window
- `configs` (optional): Comma-separated config labels. If omitted, returns all.

**Response**:
```json
{
  "hours": 24,
  "series": [
    {
      "config": "OpenAI GPT-4o",
      "dataPoints": [
        {
          "timestamp": "2026-05-07T14:00:00Z",
          "tps": 85.3
        }
      ]
    }
  ]
}
```

**Status codes**: 200

---

## Configuration File Contract

The configuration file is a TypeScript module (`config.ts`) that exports
a typed config object. It lives at the project root.

```typescript
export interface AppConfig {
  bench: BenchConfig;
  web: WebConfig;
  db: DbConfig;
}

export interface BenchConfig {
  schedule: string;         // Cron expression, e.g., "0 * * * *" (every hour)
  endpoints: EndpointConfig[];
}

export interface EndpointConfig {
  label: string;
  baseUrl: string;
  apiKeyEnvVar: string;
  model: string;
  promptTemplate?: string;  // Default: "Hello, please respond with a short greeting."
  temperature?: number;     // Default: 0
  maxTokens?: number;       // Default: 100
  timeoutMs?: number;       // Default: 30000
}

export interface WebConfig {
  port: number;             // Default: 3000
  host: string;             // Default: "127.0.0.1"
}

export interface DbConfig {
  path: string;             // Default: "./data/llm-monitor.db"
  retentionDays: number;    // Default: 30
}
```

---

## OpenAI-Compatible Endpoint Contract

The bench runner calls each configured endpoint as an OpenAI-compatible
chat completions API.

### Request

```
POST {baseUrl}/v1/chat/completions
Authorization: Bearer {apiKey}
Content-Type: application/json
```

```json
{
  "model": "gpt-4o",
  "messages": [
    {"role": "user", "content": "Hello, please respond with a short greeting."}
  ],
  "temperature": 0,
  "max_tokens": 100
}
```

### Successful Response (HTTP 200)

```json
{
  "id": "chatcmpl-abc123",
  "model": "gpt-4o",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 25,
    "total_tokens": 35
  },
  "choices": [
    {
      "message": {
        "content": "Hello! How can I assist you today?"
      },
      "finish_reason": "stop"
    }
  ]
}
```

### Error Response (HTTP 4xx/5xx)

```json
{
  "error": {
    "message": "Incorrect API key provided",
    "type": "authentication_error"
  }
}
```

The bench runner captures the HTTP status code and, on error, the error
message from the response body.
