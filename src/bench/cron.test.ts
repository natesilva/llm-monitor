import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("cron CLI", () => {
  it("includes the run subcommand in help text", () => {
    const src = readFileSync(join(import.meta.dir, "cron.ts"), "utf-8");
    expect(src).toContain('case "run"');
    expect(src).toContain(
      "run         Manually run the benchmark via the cron worker path",
    );
  });

  it("run subcommand calls runBench with config.bench.debug", () => {
    const src = readFileSync(join(import.meta.dir, "cron.ts"), "utf-8");
    expect(src).toMatch(/config\.bench\.debug/);
    expect(src).toMatch(/await runBench\(debug\)/);
  });

  it("run subcommand initializes cron logger with config.bench.logFile", () => {
    const src = readFileSync(join(import.meta.dir, "cron.ts"), "utf-8");
    expect(src).toMatch(/createCronLogger\(config\.bench\.logFile\)/);
  });

  it("run subcommand exits with code 1 on failure", () => {
    const src = readFileSync(join(import.meta.dir, "cron.ts"), "utf-8");
    const runMatch = src.match(/case "run":([\s\S]*?)break/);
    expect(runMatch).not.toBeNull();
    expect(runMatch?.[1]).toContain("process.exit(1)");
  });
});
