import { describe, expect, it, mock } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const runBenchMock = mock((_debug?: boolean) => Promise.resolve());

mock.module("./index", () => ({
  runBench: runBenchMock,
}));

const loadConfigMock = mock(() =>
  Promise.resolve({
    bench: {
      schedule: "0 * * * *",
      endpoints: [],
      debug: true,
      logFile: "data/cron.log",
    },
    web: { port: 3000, host: "127.0.0.1" },
    db: { path: "./data/llm-monitor.db", retentionDays: 30 },
  }),
);

mock.module("../shared/config", () => ({
  loadConfigFromYaml: loadConfigMock,
}));

mock.module("./cron-logger", () => ({
  createCronLogger: () => ({
    write: mock(() => {}),
    logFilePath: "data/cron.log",
  }),
}));

describe("cron-worker", () => {
  it("exports a default object with a scheduled method", async () => {
    const worker = await import("./cron-worker");
    const def = worker.default;
    expect(def).toBeDefined();
    expect(typeof def.scheduled).toBe("function");
  });

  it("scheduled() loads config and passes bench.debug to runBench", async () => {
    runBenchMock.mockClear();
    loadConfigMock.mockClear();

    const worker = await import("./cron-worker");
    const controller: Bun.CronController = {
      type: "scheduled",
      cron: "0 * * * *",
      scheduledTime: Date.now(),
    };

    await worker.default.scheduled(controller);

    expect(loadConfigMock).toHaveBeenCalled();
    expect(runBenchMock).toHaveBeenCalledWith(true);
  });

  it("loads dotenv with project-root-relative .env path", () => {
    const src = readFileSync(join(import.meta.dir, "cron-worker.ts"), "utf-8");
    expect(src).toContain("dotenv.config");
    expect(src).toContain("PROJECT_ROOT");
    expect(src).toMatch(/join\(import\.meta\.dir,\s*"..",\s*".."\)/);
  });

  it("reads bench.debug from config source", () => {
    const src = readFileSync(join(import.meta.dir, "cron-worker.ts"), "utf-8");
    expect(src).toContain("config.bench.debug");
  });
});
