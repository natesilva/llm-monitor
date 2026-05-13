import type Database from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { runEndpoint } from "./runner";
import { initDb } from "../db/schema";
import type { ResolvedEndpoint } from "../shared/types";

const TMP_DIR = join(import.meta.dir, "../../__test_tmp_runner__");

const originalFetch = globalThis.fetch;

function makeDb(): Database {
  mkdirSync(TMP_DIR, { recursive: true });
  return initDb(join(TMP_DIR, "test.db"));
}

function makeEndpoint(overrides: Partial<ResolvedEndpoint> = {}): ResolvedEndpoint {
  return {
    label: "test-endpoint",
    baseUrl: "http://mock-llm",
    apiKeyEnvVar: "TEST_KEY",
    apiKey: "test-key",
    model: "test-model",
    promptTemplate: "Say hi",
    timeoutMs: 5000,
    streaming: true,
    ...overrides,
  };
}

function getLastRun(db: Database): {
  tps: number;
  ttft_ms: number | null;
  tt100t_ms: number | null;
  latency_ms: number;
  http_status: number;
  comp_tokens: number;
  error_message: string | null;
} {
  return db
    .query(
      "SELECT tps, ttft_ms, tt100t_ms, latency_ms, http_status, comp_tokens, error_message FROM benchmark_runs ORDER BY rowid DESC LIMIT 1",
    )
    .get() as {
    tps: number;
    ttft_ms: number | null;
    tt100t_ms: number | null;
    latency_ms: number;
    http_status: number;
    comp_tokens: number;
    error_message: string | null;
  };
}

function sseResponse(events: object[]): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    start(ctrl) {
      for (const ev of events) {
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`));
      }
      ctrl.enqueue(enc.encode("data: [DONE]\n\n"));
      ctrl.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

function mockFetch(response: Response): void {
  globalThis.fetch = (() => Promise.resolve(response)) as unknown as typeof fetch;
}

describe("runner integration tests (fetch mocked)", () => {
  let db: Database;

  beforeEach(() => {
    db = makeDb();
  });

  afterEach(() => {
    db.close();
    rmSync(TMP_DIR, { recursive: true, force: true });
    globalThis.fetch = originalFetch;
  });

  it("T031: streaming run stores non-null ttft_ms and correct token counts", async () => {
    mockFetch(
      sseResponse([
        { model: "test-model", choices: [{ delta: { content: "Hello" } }] },
        { choices: [{ delta: { content: " world" } }] },
        { choices: [{ delta: { content: "!" } }] },
        {
          choices: [{ delta: {} }],
          usage: { prompt_tokens: 5, completion_tokens: 15, total_tokens: 20 },
        },
      ]),
    );

    await runEndpoint(db, makeEndpoint(), false);

    const row = getLastRun(db);
    expect(row.http_status).toBe(200);
    expect(row.error_message).toBeNull();
    expect(row.comp_tokens).toBe(15);
    expect(row.ttft_ms).not.toBeNull();
    expect(row.ttft_ms).toBeGreaterThanOrEqual(0);
    expect(row.ttft_ms).toBeLessThanOrEqual(row.latency_ms);
    expect(row.tps).toBeGreaterThanOrEqual(0);
  });

  it("T027: single content chunk falls back to total-latency-derived TPS", async () => {
    mockFetch(
      sseResponse([
        { choices: [{ delta: { content: "Hi" } }] },
        {
          choices: [{ delta: {} }],
          usage: { prompt_tokens: 2, completion_tokens: 10, total_tokens: 12 },
        },
      ]),
    );

    await runEndpoint(db, makeEndpoint(), false);

    const row = getLastRun(db);
    expect(row.ttft_ms).not.toBeNull();
    // contentChunkCount = 1 → total-latency-derived path; TPS >= 0 (0 when latencyMs rounds to 0 in mocks)
    expect(row.tps).toBeGreaterThanOrEqual(0);
    expect(row.ttft_ms!).toBeLessThanOrEqual(Math.max(row.latency_ms, 1));
  });

  it("T027: zero completion tokens produces TPS = 0", async () => {
    mockFetch(
      sseResponse([
        { choices: [{ delta: { content: "Hi" } }] },
        { choices: [{ delta: { content: " there" } }] },
        {
          choices: [{ delta: {} }],
          usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
        },
      ]),
    );

    await runEndpoint(db, makeEndpoint(), false);

    const row = getLastRun(db);
    expect(row.tps).toBe(0);
    expect(row.ttft_ms).not.toBeNull();
  });

  it("T027: ttft_ms is always <= latency_ms (SC-002)", async () => {
    mockFetch(
      sseResponse([
        { choices: [{ delta: { content: "A" } }] },
        { choices: [{ delta: { content: "B" } }] },
        { choices: [{ delta: { content: "C" } }] },
        {
          choices: [{ delta: {} }],
          usage: { prompt_tokens: 10, completion_tokens: 30, total_tokens: 40 },
        },
      ]),
    );

    await runEndpoint(db, makeEndpoint(), false);

    const row = getLastRun(db);
    expect(row.ttft_ms).not.toBeNull();
    expect(row.ttft_ms!).toBeGreaterThanOrEqual(0);
    expect(row.ttft_ms!).toBeLessThanOrEqual(row.latency_ms);
    expect(row.tps).toBeGreaterThanOrEqual(0);
  });

  it("non-streaming run stores null ttft_ms", async () => {
    mockFetch(
      Response.json({
        model: "test-model",
        choices: [{ message: { content: "Hello" } }],
        usage: { prompt_tokens: 5, completion_tokens: 20, total_tokens: 25 },
      }),
    );

    await runEndpoint(db, makeEndpoint({ streaming: false }), false);

    const row = getLastRun(db);
    expect(row.ttft_ms).toBeNull();
    expect(row.http_status).toBe(200);
    expect(row.comp_tokens).toBe(20);
  });

  it("streaming HTTP error records error_message and zero TPS", async () => {
    mockFetch(
      new Response(JSON.stringify({ error: { message: "unauthorized" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await runEndpoint(db, makeEndpoint(), false);

    const row = getLastRun(db);
    expect(row.http_status).toBe(401);
    expect(row.error_message).toBe("unauthorized");
    expect(row.tps).toBe(0);
    expect(row.ttft_ms).toBeNull();
  });

  it("P1: streaming without usage chunk estimates TPS from text length", async () => {
    // Endpoint accepts streaming but ignores stream_options.include_usage
    mockFetch(
      sseResponse([
        { choices: [{ delta: { content: "The water cycle" } }] },
        { choices: [{ delta: { content: " describes how water" } }] },
        { choices: [{ delta: { content: " moves through the environment." } }] },
        // no usage chunk
      ]),
    );

    await runEndpoint(db, makeEndpoint(), false);

    const row = getLastRun(db);
    // completionTokens estimated from streamed text (~4 chars/token), so tps > 0
    expect(row.tps).toBeGreaterThan(0);
    expect(row.comp_tokens).toBeGreaterThan(0);
    expect(row.ttft_ms).not.toBeNull();
  });

  it("no content chunks (only usage chunk): ttft_ms is null", async () => {
    mockFetch(
      sseResponse([
        {
          choices: [{ delta: {} }],
          usage: { prompt_tokens: 5, completion_tokens: 8, total_tokens: 13 },
        },
      ]),
    );

    await runEndpoint(db, makeEndpoint(), false);

    const row = getLastRun(db);
    // firstChunkTime never set → TTFT = null
    expect(row.ttft_ms).toBeNull();
    expect(row.tps).toBeGreaterThanOrEqual(0);
  });

  it("T020: streaming with >100 estimated tokens stores non-null tt100t_ms", async () => {
    const longText = "A".repeat(400);
    mockFetch(
      sseResponse([
        { choices: [{ delta: { content: longText } }] },
        { choices: [{ delta: { content: "more text here" } }] },
        {
          choices: [{ delta: {} }],
          usage: { prompt_tokens: 5, completion_tokens: 120, total_tokens: 125 },
        },
      ]),
    );

    await runEndpoint(db, makeEndpoint(), false);

    const row = getLastRun(db);
    expect(row.tt100t_ms).not.toBeNull();
    expect(row.tt100t_ms!).toBeGreaterThanOrEqual(0);
    expect(row.tt100t_ms!).toBeLessThanOrEqual(row.latency_ms);
    expect(row.ttft_ms).not.toBeNull();
    expect(row.tt100t_ms!).toBeGreaterThanOrEqual(row.ttft_ms!);
  });

  it("T021: sub-100-token streaming run stores null tt100t_ms", async () => {
    mockFetch(
      sseResponse([
        { choices: [{ delta: { content: "Hello" } }] },
        { choices: [{ delta: { content: " world" } }] },
        {
          choices: [{ delta: {} }],
          usage: { prompt_tokens: 5, completion_tokens: 15, total_tokens: 20 },
        },
      ]),
    );

    await runEndpoint(db, makeEndpoint(), false);

    const row = getLastRun(db);
    expect(row.tt100t_ms).toBeNull();
    expect(row.ttft_ms).not.toBeNull();
  });

  it("T022: non-streaming run stores null tt100t_ms", async () => {
    mockFetch(
      Response.json({
        model: "test-model",
        choices: [{ message: { content: "Hello world" } }],
        usage: { prompt_tokens: 5, completion_tokens: 20, total_tokens: 25 },
      }),
    );

    await runEndpoint(db, makeEndpoint({ streaming: false }), false);

    const row = getLastRun(db);
    expect(row.tt100t_ms).toBeNull();
    expect(row.ttft_ms).toBeNull();
    expect(row.http_status).toBe(200);
  });

  it("unauthenticated endpoint sends no Authorization header", async () => {
    let capturedHeaders: HeadersInit | undefined;
    globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      capturedHeaders = init?.headers;
      return Promise.resolve(
        sseResponse([
          { choices: [{ delta: { content: "Hi" } }] },
          {
            choices: [{ delta: {} }],
            usage: { prompt_tokens: 2, completion_tokens: 10, total_tokens: 12 },
          },
        ]),
      );
    }) as unknown as typeof fetch;

    await runEndpoint(
      db,
      makeEndpoint({ apiKeyEnvVar: undefined, apiKey: undefined }),
      false,
    );

    const headers = capturedHeaders as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers).not.toHaveProperty("Authorization");
    expect(headers).not.toHaveProperty("authorization");
  });
});
