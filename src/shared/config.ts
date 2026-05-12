import type { AppConfig, EndpointConfig, ResolvedEndpoint } from "./types";

const DEFAULTS = {
  promptTemplate: "Explain the water cycle in a few paragraphs.",
  temperature: 0,
  maxTokens: 1024,
  timeoutMs: 30000,
  port: 3000,
  host: "127.0.0.1",
  retentionDays: 30,
  dbPath: "./data/llm-monitor.db",
} as const;

const CONFIG_PATH = process.env.CONFIG_PATH ?? "config.yaml";

export async function loadConfigFromYaml(): Promise<AppConfig> {
  const file = Bun.file(CONFIG_PATH);
  if (!(await file.exists())) {
    throw new Error(
      `Configuration file not found: ${CONFIG_PATH}. Copy config.example.yaml to config.yaml and edit it.`,
    );
  }

  let text: string;
  try {
    text = await file.text();
  } catch (err) {
    throw new Error(`Failed to read configuration file ${CONFIG_PATH}: ${err}`);
  }

  let raw: unknown;
  try {
    raw = Bun.YAML.parse(text);
  } catch (err) {
    throw new Error(
      `Failed to parse YAML in ${CONFIG_PATH}: ${err instanceof Error ? err.message : err}`,
    );
  }

  const config: AppConfig = {
    bench: {
      schedule: (raw as AppConfig).bench.schedule,
      endpoints: (raw as AppConfig).bench.endpoints.map(normalizeEndpoint),
    },
    web: {
      port: (raw as AppConfig).web.port ?? DEFAULTS.port,
      host: (raw as AppConfig).web.host ?? DEFAULTS.host,
    },
    db: {
      path: (raw as AppConfig).db.path ?? DEFAULTS.dbPath,
      retentionDays:
        (raw as AppConfig).db.retentionDays ?? DEFAULTS.retentionDays,
    },
  };

  validateConfig(config);
  return config;
}

function normalizeEndpoint(ep: EndpointConfig): EndpointConfig {
  return {
    label: ep.label,
    baseUrl: ep.baseUrl,
    apiKeyEnvVar: ep.apiKeyEnvVar,
    model: ep.model,
    promptTemplate: ep.promptTemplate ?? DEFAULTS.promptTemplate,
    temperature: ep.temperature ?? DEFAULTS.temperature,
    maxTokens: ep.maxTokens ?? DEFAULTS.maxTokens,
    timeoutMs: ep.timeoutMs ?? DEFAULTS.timeoutMs,
    streaming: ep.streaming,
  };
}

function validateConfig(config: AppConfig): void {
  if (!config.bench.schedule) {
    throw new Error("bench.schedule is required");
  }

  const labels = new Set<string>();
  for (const ep of config.bench.endpoints) {
    if (!ep.label) throw new Error("Each endpoint must have a label");
    if (labels.has(ep.label)) {
      throw new Error(`Duplicate endpoint label: ${ep.label}`);
    }
    labels.add(ep.label);

    if (!ep.baseUrl)
      throw new Error(`Endpoint "${ep.label}": baseUrl is required`);
    if (!ep.model) throw new Error(`Endpoint "${ep.label}": model is required`);
    if (!ep.apiKeyEnvVar) {
      throw new Error(`Endpoint "${ep.label}": apiKeyEnvVar is required`);
    }

    if (
      ep.temperature !== undefined &&
      (ep.temperature < 0 || ep.temperature > 2)
    ) {
      throw new Error(`Endpoint "${ep.label}": temperature must be in [0, 2]`);
    }
  }

  if (!config.db.path) throw new Error("db.path is required");
  if (config.db.retentionDays !== undefined && config.db.retentionDays < 1) {
    throw new Error("db.retentionDays must be >= 1");
  }
}

export function resolveApiKeys(
  endpoints: EndpointConfig[],
): ResolvedEndpoint[] {
  return endpoints.map((ep) => {
    const apiKey = process.env[ep.apiKeyEnvVar]?.trim();
    if (!apiKey) {
      throw new Error(
        `Environment variable "${ep.apiKeyEnvVar}" is not set or empty (required by endpoint "${ep.label}")`,
      );
    }
    return { ...ep, apiKey };
  });
}
