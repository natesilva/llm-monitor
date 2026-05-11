import type Database from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { insertRun } from "../db/queries";
import { initDb } from "../db/schema";
import type { AppConfig } from "../shared/types";
import { createRouter } from "./routes";

const TMP_DIR = join(import.meta.dir, "../../__test_tmp__");

function makeConfig(): AppConfig {
  return {
    bench: {
      schedule: "0 * * * *",
      endpoints: [],
    },
    web: { port: 0, host: "127.0.0.1" },
    db: { path: join(TMP_DIR, "test.db"), retentionDays: 30 },
  };
}

function makeDb(): Database {
  mkdirSync(TMP_DIR, { recursive: true });
  return initDb(join(TMP_DIR, "test.db"));
}

function seedData(db: Database) {
  const now = Date.now();
  const configs = ["gpt-4o", "gpt-4o-mini"];
  for (const cfg of configs) {
    for (let i = 0; i < 5; i++) {
      insertRun(db, {
        configLabel: cfg,
        model: cfg,
        timestamp: new Date(now - i * 3600_000).toISOString(),
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
        latencyMs: 500 + i * 50,
        tokensPerSecond: 40 - i * 2,
        timeToFirstTokenMs: i % 2 === 0 ? 120 + i * 10 : null,
        httpStatus: 200,
      });
    }
  }
}

describe("web routes", () => {
  let db: Database;
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    db = makeDb();
    seedData(db);
    router = createRouter(db, makeConfig());
  });

  afterEach(() => {
    db.close();
    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("returns config list from /api/configs", async () => {
    const res = await router(new Request("http://localhost/api/configs"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.configs).toContain("gpt-4o");
    expect(body.configs).toContain("gpt-4o-mini");
  });

  it("returns metrics from /api/metrics", async () => {
    const res = await router(
      new Request("http://localhost/api/metrics?config=gpt-4o&hours=48"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.config).toBe("gpt-4o");
    expect(body.dataPoints.length).toBe(5);
    expect(body.stats.avgTps).toBeGreaterThan(0);
    expect(body.stats.p50TtftMs).not.toBeUndefined();
    expect(body.stats.p95TtftMs).not.toBeUndefined();
  });

  it("data points include ttftMs field", async () => {
    const res = await router(
      new Request("http://localhost/api/metrics?config=gpt-4o&hours=48"),
    );
    const body = await res.json();
    for (const dp of body.dataPoints) {
      expect("ttftMs" in dp).toBe(true);
    }
    const nonNullTtft = body.dataPoints.filter(
      (dp: { ttftMs: number | null }) => dp.ttftMs !== null,
    );
    expect(nonNullTtft.length).toBeGreaterThan(0);
  });

  it("returns 400 when config param missing from /api/metrics", async () => {
    const res = await router(new Request("http://localhost/api/metrics"));
    expect(res.status).toBe(400);
  });

  it("returns comparison data from /api/metrics/compare", async () => {
    const res = await router(
      new Request(
        "http://localhost/api/metrics/compare?hours=24&configs=gpt-4o,gpt-4o-mini",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hours).toBe(24);
    expect(body.series.length).toBe(2);
    const labels = body.series.map((s: { config: string }) => s.config);
    expect(labels).toContain("gpt-4o");
    expect(labels).toContain("gpt-4o-mini");
  });

  it("comparison series data points have timestamp and tps for time scale", async () => {
    const res = await router(
      new Request(
        "http://localhost/api/metrics/compare?hours=24&configs=gpt-4o",
      ),
    );
    const body = await res.json();
    const series = body.series[0];
    expect(series.config).toBe("gpt-4o");
    expect(series.dataPoints.length).toBe(5);
    for (const dp of series.dataPoints) {
      expect(typeof dp.timestamp).toBe("string");
      expect(typeof dp.tps).toBe("number");
      expect(new Date(dp.timestamp).getTime()).not.toBeNaN();
    }
  });

  it("returns comparison data without config filter", async () => {
    const res = await router(
      new Request("http://localhost/api/metrics/compare?hours=24"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.series.length).toBe(2);
  });

  it("returns data points from /api/metrics/data-points", async () => {
    const res = await router(
      new Request(
        "http://localhost/api/metrics/data-points?config=gpt-4o&hours=48&limit=50",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.config).toBe("gpt-4o");
    expect(Array.isArray(body.dataPoints)).toBe(true);
    expect(body.dataPoints.length).toBe(5);
    for (const dp of body.dataPoints) {
      expect("ttftMs" in dp).toBe(true);
    }
  });

  it("returns 400 when config param missing from /api/metrics/data-points", async () => {
    const res = await router(
      new Request("http://localhost/api/metrics/data-points?hours=48"),
    );
    expect(res.status).toBe(400);
  });

  it("serves index.html for /", async () => {
    const res = await router(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("LLM Performance Monitor");
    expect(text).toContain("chartjs-adapter-date-fns");
  });

  it("serves app.js", async () => {
    const res = await router(new Request("http://localhost/app.js"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("renderComparison");
  });

  it("returns 404 for unknown paths", async () => {
    const res = await router(new Request("http://localhost/nope"));
    expect(res.status).toBe(404);
  });
});
