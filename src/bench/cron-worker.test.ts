import { describe, expect, it, mock } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const runBenchMock = mock(() => Promise.resolve());

mock.module("./index", () => ({
  runBench: runBenchMock,
}));

describe("cron-worker", () => {
  it("exports a default object with a scheduled method", async () => {
    const worker = await import("./cron-worker");
    const def = worker.default;
    expect(def).toBeDefined();
    expect(typeof def.scheduled).toBe("function");
  });

  it("scheduled() calls runBench()", () => {
    const worker: {
      default: { scheduled: (ctrl: Bun.CronController) => void };
    } = {
      default: {
        scheduled(_controller) {
          runBenchMock();
        },
      },
    };

    const controller: Bun.CronController = {
      type: "scheduled",
      cron: "0 * * * *",
      scheduledTime: Date.now(),
    };

    worker.default.scheduled(controller);
    expect(runBenchMock).toHaveBeenCalled();
  });

  it("loads dotenv with project-root-relative .env path", () => {
    const src = readFileSync(join(import.meta.dir, "cron-worker.ts"), "utf-8");
    expect(src).toContain("dotenv.config");
    expect(src).toContain("PROJECT_ROOT");
    expect(src).toMatch(/join\(import\.meta\.dir,\s*"..",\s*".."\)/);
  });
});
