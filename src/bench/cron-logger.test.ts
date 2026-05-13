import { afterAll, describe, expect, it } from "bun:test";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCronLogger, getDefaultLogFile } from "./cron-logger";

const TEST_DIR = join(tmpdir(), `cron-logger-test-${Date.now()}`);

afterAll(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

describe("cron-logger", () => {
  it("creates log file at default path when no path specified", () => {
    const defaultPath = getDefaultLogFile();
    expect(defaultPath).toBe("data/cron.log");
  });

  it("creates log file and directory if they do not exist", () => {
    const logPath = join(TEST_DIR, "sub", "dir", "test.log");
    const logger = createCronLogger(logPath);

    expect(existsSync(logPath)).toBe(true);
    logger.write("test message");

    const content = readFileSync(logPath, "utf-8");
    expect(content).toContain("--- Cron run");
    expect(content).toContain("test message");
  });

  it("appends to existing log file across multiple runs", () => {
    const logPath = join(TEST_DIR, "append.log");

    const logger1 = createCronLogger(logPath);
    logger1.write("first run");

    const logger2 = createCronLogger(logPath);
    logger2.write("second run");

    const content = readFileSync(logPath, "utf-8");
    const runCount = content.split("--- Cron run").length - 1;
    expect(runCount).toBe(2);
    expect(content).toContain("first run");
    expect(content).toContain("second run");
  });

  it("writes timestamped header for each run", () => {
    const logPath = join(TEST_DIR, "header.log");
    const _logger = createCronLogger(logPath);

    const content = readFileSync(logPath, "utf-8");
    expect(content).toMatch(/--- Cron run \d{4}-\d{2}-\d{2}T/);
  });

  it("resolves log file path to absolute path", () => {
    const logPath = join(TEST_DIR, "resolve.log");
    const logger = createCronLogger(logPath);

    expect(logger.logFilePath).toBe(logPath);
  });
});
