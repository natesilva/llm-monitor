import { resolve, join } from "node:path";
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

const PROJECT_ROOT = resolve(import.meta.dir, "..", "..");
const CONFIG_PATH = resolve(PROJECT_ROOT, process.env.CONFIG_PATH ?? "config.yaml");

export async function loadConfigFromYaml(): Promise<AppConfig> {
  let raw: unknown;
  try {
    const mod = await import(CONFIG_PATH);
    raw = mod.default;
  } catch (err) {
    throw new Error(
      `Failed to load configuration file ${CONFIG_PATH}: ${err instanceof Error ? err.message : err}. Copy config.example.yaml to config.yaml and edit it.`,
    );
  }

  const config: AppConfig = {
    bench: {
      schedule: (raw as AppConfig).bench.schedule,
      endpoints: (raw as AppConfig).bench.endpoints.map(normalizeEndpoint),
      debug: (raw as AppConfig).bench.debug ?? false,
      logFile: (raw as AppConfig).bench.logFile,
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
