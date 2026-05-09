import { insertRun } from "../db/queries";
import type { Database } from "../db/schema";
import type { ResolvedEndpoint } from "../shared/types";

export async function runEndpoint(
  db: Database,
  endpoint: ResolvedEndpoint,
  debug: boolean,
  prompt?: string,
): Promise<void> {
  const label = endpoint.label;
  console.log(`[${label}] Running benchmark...`);

  const userId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const body = {
    model: endpoint.model,
    messages: [{ role: "user", content: prompt ?? endpoint.promptTemplate }],
    temperature: endpoint.temperature,
    max_tokens: endpoint.maxTokens,
    user: userId,
  };

  if (debug) {
    console.log(`[${label}] Request: ${JSON.stringify(body)}`);
  }

  const start = performance.now();
  let httpStatus = 0;
  let errorMessage: string | undefined;
  let model = endpoint.model;
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), endpoint.timeoutMs);

    const res = await fetch(`${endpoint.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${endpoint.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    httpStatus = res.status;

    const text = await res.text();

    if (debug) {
      const truncated = text.length > 1000 ? `${text.slice(0, 1000)}...` : text;
      console.log(`[${label}] Response: ${truncated}`);
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      errorMessage = `HTTP ${res.status}: non-JSON response (${text.slice(0, 200)})`;
      json = null;
    }

    if (res.ok && json) {
      const data = json as Record<string, unknown>;
      model = (data.model as string) ?? endpoint.model;
      promptTokens = (data.usage as Record<string, number>)?.prompt_tokens ?? 0;
      completionTokens =
        (data.usage as Record<string, number>)?.completion_tokens ?? 0;
      totalTokens = (data.usage as Record<string, number>)?.total_tokens ?? 0;
    } else if (!errorMessage) {
      const data = json as Record<string, unknown> | null;
      errorMessage =
        (data as Record<string, Record<string, string>>)?.error?.message ??
        `HTTP ${res.status}: ${text.slice(0, 200)}`;
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      httpStatus = 0;
      errorMessage = `Request timed out after ${endpoint.timeoutMs}ms`;
    } else {
      httpStatus = 0;
      errorMessage = err instanceof Error ? err.message : String(err);
    }
  }

  const latencyMs = Math.round(performance.now() - start);
  const tps = latencyMs > 0 ? completionTokens / (latencyMs / 1000) : 0;

  insertRun(db, {
    configLabel: label,
    model,
    timestamp: new Date().toISOString(),
    promptTokens,
    completionTokens,
    totalTokens,
    latencyMs,
    tokensPerSecond: Math.round(tps * 100) / 100,
    httpStatus,
    errorMessage,
  });

  if (errorMessage) {
    console.error(`[${label}] Failed: ${errorMessage}`);
  } else {
    console.log(
      `[${label}] OK — ${tps.toFixed(1)} TPS, ${latencyMs}ms, ${completionTokens} tokens`,
    );
  }
}
