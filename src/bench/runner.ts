import type { Database } from "../db/schema";
import type { ResolvedEndpoint } from "../shared/types";
import { insertRun } from "../db/queries";

export async function runEndpoint(
  db: Database,
  endpoint: ResolvedEndpoint,
): Promise<void> {
  const label = endpoint.label;
  console.log(`[${label}] Running benchmark...`);

  const body = {
    model: endpoint.model,
    messages: [{ role: "user", content: endpoint.promptTemplate }],
    temperature: endpoint.temperature,
    max_tokens: endpoint.maxTokens,
  };

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

    const res = await fetch(`${endpoint.baseUrl}/v1/chat/completions`, {
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

    const json = await res.json();

    if (res.ok) {
      model = json.model ?? endpoint.model;
      promptTokens = json.usage?.prompt_tokens ?? 0;
      completionTokens = json.usage?.completion_tokens ?? 0;
      totalTokens = json.usage?.total_tokens ?? 0;
    } else {
      errorMessage =
        json.error?.message ??
        `HTTP ${res.status}: ${JSON.stringify(json).slice(0, 200)}`;
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
