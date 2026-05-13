import { describe, expect, it } from "bun:test";
import { resolveApiKeys, validateConfig } from "./config";
import type { AppConfig, EndpointConfig } from "./types";

function makeConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    bench: {
      schedule: "0 * * * *",
      endpoints: [
        {
          label: "test",
          baseUrl: "http://localhost:11434/v1",
          model: "llama3",
        },
      ],
      ...overrides.bench,
    },
    web: { port: 3000, host: "127.0.0.1" },
    db: { path: "./data/test.db", retentionDays: 30 },
    ...overrides,
  };
}

describe("resolveApiKeys", () => {
  it("returns apiKey undefined when apiKeyEnvVar is absent", () => {
    const endpoints: EndpointConfig[] = [
      {
        label: "local-llama",
        baseUrl: "http://localhost:11434/v1",
        model: "llama3",
      },
    ];

    const resolved = resolveApiKeys(endpoints);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].apiKey).toBeUndefined();
  });

  it("resolves apiKey from environment when apiKeyEnvVar is set", () => {
    process.env._TEST_API_KEY = "sk-test-123";
    const endpoints: EndpointConfig[] = [
      {
        label: "openai",
        baseUrl: "https://api.openai.com/v1",
        apiKeyEnvVar: "_TEST_API_KEY",
        model: "gpt-4",
      },
    ];

    const resolved = resolveApiKeys(endpoints);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].apiKey).toBe("sk-test-123");

    delete process.env._TEST_API_KEY;
  });

  it("throws when apiKeyEnvVar references an unset env var", () => {
    const endpoints: EndpointConfig[] = [
      {
        label: "openai",
        baseUrl: "https://api.openai.com/v1",
        apiKeyEnvVar: "_MISSING_KEY_",
        model: "gpt-4",
      },
    ];

    expect(() => resolveApiKeys(endpoints)).toThrow(
      /Environment variable "_MISSING_KEY_" is not set or empty/,
    );
  });
});

describe("validateConfig", () => {
  it("accepts endpoint without apiKeyEnvVar", () => {
    const config = makeConfig();
    expect(() => validateConfig(config)).not.toThrow();
  });

  it("accepts endpoint with apiKeyEnvVar", () => {
    const config = makeConfig({
      bench: {
        schedule: "0 * * * *",
        endpoints: [
          {
            label: "openai",
            baseUrl: "https://api.openai.com/v1",
            apiKeyEnvVar: "OPENAI_API_KEY",
            model: "gpt-4",
          },
        ],
      },
    });
    expect(() => validateConfig(config)).not.toThrow();
  });
});
