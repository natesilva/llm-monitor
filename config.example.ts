import type { AppConfig } from "./src/shared/types";

const config: AppConfig = {
  bench: {
    schedule: "0 * * * *",
    endpoints: [
      {
        label: "OpenAI GPT-4o",
        baseUrl: "https://api.openai.com",
        apiKeyEnvVar: "OPENAI_API_KEY",
        model: "gpt-4o",
      },
      {
        label: "OpenAI GPT-4o-mini",
        baseUrl: "https://api.openai.com",
        apiKeyEnvVar: "OPENAI_API_KEY",
        model: "gpt-4o-mini",
      },
    ],
  },
  web: {
    port: 3000,
    host: "127.0.0.1",
  },
  db: {
    path: "./data/llm-monitor.db",
    retentionDays: 30,
  },
};

export default config;
