import type Database from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { insertRun, getMetricsForConfig } from "./queries";
import { initDb } from "./schema";

const TMP_DIR = join(import.meta.dir, "../../__test_tmp_queries__");

function makeDb(): Database {
  mkdirSync(TMP_DIR, { recursive: true });
  return initDb(join(TMP_DIR, "test.db"));
}

function baseRun(overrides: Partial<Parameters<typeof insertRun>[1]> = {}): Parameters<typeof insertRun>[1] {
  return {
    configLabel: "test",
    model: "test-model",
    timestamp: new Date().toISOString(),
    promptTokens: 10,
    completionTokens: 20,
    totalTokens: 30,
    latencyMs: 500,
    tokensPerSecond: 40,
    timeToFirstTokenMs: null,
    timeToFirst100TokensMs: null,
    httpStatus: 200,
    ...overrides,
  };
}

describe("computeStats via getMetricsForConfig", () => {
  let db: Database;

  beforeEach(() => {
    db = makeDb();
  });

  afterEach(() => {
    db.close();
    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("returns null TTFT stats when all rows have null ttft", () => {
    const now = Date.now();
    for (let i = 0; i < 3; i++) {
      insertRun(db, baseRun({
        timestamp: new Date(now - i * 1000).toISOString(),
        timeToFirstTokenMs: null,
      }));
    }
    const result = getMetricsForConfig(db, "test", 48);
    expect(result.stats.p50TtftMs).toBeNull();
    expect(result.stats.p95TtftMs).toBeNull();
  });

  it("computes TTFT percentiles when all rows have non-null ttft", () => {
    const now = Date.now();
    const ttftValues = [100, 200, 300, 400, 500];
    for (let i = 0; i < ttftValues.length; i++) {
      insertRun(db, baseRun({
        timestamp: new Date(now - i * 1000).toISOString(),
        timeToFirstTokenMs: ttftValues[i],
      }));
    }
    const result = getMetricsForConfig(db, "test", 48);
    expect(result.stats.p50TtftMs).not.toBeNull();
    expect(result.stats.p95TtftMs).not.toBeNull();
    // p50 of [100,200,300,400,500] sorted = 300
    expect(result.stats.p50TtftMs).toBe(300);
    // p95 of 5 values: idx = 0.95 * 4 = 3.8, interpolated between 400 and 500
    expect(result.stats.p95TtftMs).toBe(480);
  });

  it("computes TTFT percentiles from non-null values only when mixed", () => {
    const now = Date.now();
    // Insert 3 streaming runs with TTFT and 2 non-streaming runs without
    const ttftValues = [100, 300, 500];
    for (let i = 0; i < ttftValues.length; i++) {
      insertRun(db, baseRun({
        timestamp: new Date(now - i * 2000).toISOString(),
        timeToFirstTokenMs: ttftValues[i],
      }));
    }
    for (let i = 0; i < 2; i++) {
      insertRun(db, baseRun({
        timestamp: new Date(now - (i + 10) * 2000).toISOString(),
        timeToFirstTokenMs: null,
      }));
    }
    const result = getMetricsForConfig(db, "test", 48);
    // Only [100, 300, 500] participate in TTFT percentile calculation
    expect(result.stats.p50TtftMs).toBe(300);
    expect(result.stats.p95TtftMs).not.toBeNull();
  });

  it("returns zero stats for empty row set", () => {
    const result = getMetricsForConfig(db, "nonexistent", 48);
    expect(result.stats.avgTps).toBe(0);
    expect(result.stats.p50LatencyMs).toBe(0);
    expect(result.stats.p95LatencyMs).toBe(0);
    expect(result.stats.successRate).toBe(0);
    expect(result.stats.tpsStdDev).toBe(0);
    expect(result.stats.p50TtftMs).toBeNull();
    expect(result.stats.p95TtftMs).toBeNull();
    expect(result.stats.avgTt100tMs).toBeNull();
    expect(result.dataPoints.length).toBe(0);
  });

  it("data points include ttftMs field matching inserted values", () => {
    const now = Date.now();
    insertRun(db, baseRun({ timestamp: new Date(now - 2000).toISOString(), timeToFirstTokenMs: 150 }));
    insertRun(db, baseRun({ timestamp: new Date(now - 1000).toISOString(), timeToFirstTokenMs: null }));

    const result = getMetricsForConfig(db, "test", 48);
    expect(result.dataPoints.length).toBe(2);
    const ttftValues = result.dataPoints.map((dp) => dp.ttftMs);
    expect(ttftValues).toContain(150);
    expect(ttftValues).toContain(null);
  });

  it("single-row TTFT: p50 and p95 equal that single value", () => {
    insertRun(db, baseRun({ timeToFirstTokenMs: 250 }));
    const result = getMetricsForConfig(db, "test", 48);
    expect(result.stats.p50TtftMs).toBe(250);
    expect(result.stats.p95TtftMs).toBe(250);
  });

  it("returns null avgTt100tMs when all rows have null tt100t", () => {
    const now = Date.now();
    for (let i = 0; i < 3; i++) {
      insertRun(db, baseRun({
        timestamp: new Date(now - i * 1000).toISOString(),
        timeToFirst100TokensMs: null,
      }));
    }
    const result = getMetricsForConfig(db, "test", 48);
    expect(result.stats.avgTt100tMs).toBeNull();
  });

  it("computes avgTt100tMs when all rows have non-null tt100t", () => {
    const now = Date.now();
    const values = [2000, 3000, 4000];
    for (let i = 0; i < values.length; i++) {
      insertRun(db, baseRun({
        timestamp: new Date(now - i * 1000).toISOString(),
        timeToFirst100TokensMs: values[i],
      }));
    }
    const result = getMetricsForConfig(db, "test", 48);
    expect(result.stats.avgTt100tMs).toBe(3000);
  });

  it("computes avgTt100tMs from non-null values only when mixed", () => {
    const now = Date.now();
    insertRun(db, baseRun({
      timestamp: new Date(now - 2000).toISOString(),
      timeToFirst100TokensMs: 2000,
    }));
    insertRun(db, baseRun({
      timestamp: new Date(now - 1000).toISOString(),
      timeToFirst100TokensMs: null,
    }));
    insertRun(db, baseRun({
      timestamp: new Date(now).toISOString(),
      timeToFirst100TokensMs: 4000,
    }));
    const result = getMetricsForConfig(db, "test", 48);
    // Average of [2000, 4000] = 3000
    expect(result.stats.avgTt100tMs).toBe(3000);
  });

  it("data points include tt100tMs field matching inserted values", () => {
    const now = Date.now();
    insertRun(db, baseRun({ timestamp: new Date(now - 2000).toISOString(), timeToFirst100TokensMs: 1500 }));
    insertRun(db, baseRun({ timestamp: new Date(now - 1000).toISOString(), timeToFirst100TokensMs: null }));

    const result = getMetricsForConfig(db, "test", 48);
    expect(result.dataPoints.length).toBe(2);
    const tt100tValues = result.dataPoints.map((dp) => dp.tt100tMs);
    expect(tt100tValues).toContain(1500);
    expect(tt100tValues).toContain(null);
  });
});
