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

  if (endpoint.streaming !== false) {
    await runStreamingEndpoint(db, endpoint, label, userId, debug, prompt);
  } else {
    await runNonStreamingEndpoint(db, endpoint, label, userId, debug, prompt);
  }
}

async function runStreamingEndpoint(
  db: Database,
  endpoint: ResolvedEndpoint,
  label: string,
  userId: string,
  debug: boolean,
  prompt?: string,
): Promise<void> {
  const body = {
    model: endpoint.model,
    messages: [
      {
        role: "user",
        content: `[run:${userId}]\n\n${prompt ?? endpoint.promptTemplate}`,
      },
    ],
    temperature: endpoint.temperature,
    max_tokens: endpoint.maxTokens,
    user: userId,
    stream: true,
    stream_options: { include_usage: true },
  };

  if (debug) {
    console.log(`[${label}] Request (streaming): ${JSON.stringify(body)}`);
  }

  const start = performance.now();
  let httpStatus = 0;
  let errorMessage: string | undefined;
  let model = endpoint.model;
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;
  let firstChunkTime: number | null = null;
  let lastChunkTime: number | null = null;
  let totalChunkCount = 0;
  let streamedTextLength = 0; // fallback token estimate when usage chunk is absent
  let usageReceived = false;

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

    if (!res.ok || !res.body) {
      const text = await res.text();
      if (debug) {
        const truncated =
          text.length > 1000 ? `${text.slice(0, 1000)}...` : text;
        console.log(`[${label}] Response: ${truncated}`);
      }
      let errJson: Record<string, unknown> | null = null;
      try {
        errJson = JSON.parse(text) as Record<string, unknown>;
      } catch {
        // not JSON
      }
      errorMessage =
        (errJson as Record<string, Record<string, string>> | null)?.error
          ?.message ?? `HTTP ${res.status}: ${text.slice(0, 200)}`;
    } else {
      const decoder = new TextDecoder();
      let buffer = "";

      for await (const rawChunk of res.body) {
        buffer += decoder.decode(rawChunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          parseSSELine(line, (parsed) => {
            if (debug) {
              console.log(`[${label}] SSE: ${JSON.stringify(parsed)}`);
            }
            if (parsed.model && typeof parsed.model === "string") {
              model = parsed.model;
            }
            const usage = parsed.usage as
              | Record<string, number>
              | null
              | undefined;
            if (usage) {
              usageReceived = true;
              promptTokens = usage.prompt_tokens ?? promptTokens;
              completionTokens = usage.completion_tokens ?? completionTokens;
              totalTokens = usage.total_tokens ?? totalTokens;
            }
            const choices = parsed.choices as
              | Array<{ delta?: { content?: string; reasoning_content?: string } }>
              | undefined;
            const delta = choices?.[0]?.delta;
            const content = delta?.content;
            const reasoning = delta?.reasoning_content;
            const hasContent = typeof content === "string" && content.length > 0;
            const hasReasoning = typeof reasoning === "string" && reasoning.length > 0;
            if (hasContent || hasReasoning) {
              const now = performance.now();
              if (firstChunkTime === null) firstChunkTime = now;
              lastChunkTime = now;
              totalChunkCount++;
              if (hasContent) streamedTextLength += (content as string).length;
              if (hasReasoning) streamedTextLength += (reasoning as string).length;
            }
          });
        }
      }

      // Flush any remaining partial line
      buffer += decoder.decode();
      for (const line of buffer.split("\n")) {
        parseSSELine(line, (parsed) => {
          const usage = parsed.usage as
            | Record<string, number>
            | null
            | undefined;
          if (usage) {
            usageReceived = true;
            promptTokens = usage.prompt_tokens ?? promptTokens;
            completionTokens = usage.completion_tokens ?? completionTokens;
            totalTokens = usage.total_tokens ?? totalTokens;
          }
        });
      }
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

  // If the endpoint ignored stream_options.include_usage, estimate from streamed text.
  let tokensEstimated = false;
  if (!usageReceived && streamedTextLength > 0) {
    completionTokens = Math.round(streamedTextLength / 4);
    tokensEstimated = true;
  }

  // TTFT: time from request start to first token (reasoning or visible content).
  // This matches the standard industry definition and is consistent with the TPS window.
  const timeToFirstTokenMs =
    firstChunkTime !== null ? Math.round(firstChunkTime - start) : null;

  // TPS: all completion tokens over the full generation window (first token → last token).
  let tokensPerSecond: number;
  if (
    firstChunkTime !== null &&
    lastChunkTime !== null &&
    totalChunkCount > 1 &&
    completionTokens > 0
  ) {
    const streamMs = lastChunkTime - firstChunkTime;
    tokensPerSecond =
      streamMs > 0
        ? Math.round((completionTokens / (streamMs / 1000)) * 100) / 100
        : 0;
  } else {
    tokensPerSecond =
      latencyMs > 0 && completionTokens > 0
        ? Math.round((completionTokens / (latencyMs / 1000)) * 100) / 100
        : 0;
  }

  insertRun(db, {
    configLabel: label,
    model,
    timestamp: new Date().toISOString(),
    promptTokens,
    completionTokens,
    totalTokens,
    latencyMs,
    tokensPerSecond,
    timeToFirstTokenMs,
    httpStatus,
    errorMessage,
  });

  if (errorMessage) {
    console.error(`[${label}] Failed: ${errorMessage}`);
  } else {
    const ttftPart =
      timeToFirstTokenMs !== null ? `${timeToFirstTokenMs}ms TTFT, ` : "";
    const tokenNote = tokensEstimated ? " (est.)" : "";
    console.log(
      `[${label}] OK — ${tokensPerSecond.toFixed(1)} TPS, ${ttftPart}${latencyMs}ms total, ${completionTokens}${tokenNote} tokens`,
    );
  }
}

async function runNonStreamingEndpoint(
  db: Database,
  endpoint: ResolvedEndpoint,
  label: string,
  userId: string,
  debug: boolean,
  prompt?: string,
): Promise<void> {
  const body = {
    model: endpoint.model,
    messages: [
      {
        role: "user",
        content: `[run:${userId}]\n\n${prompt ?? endpoint.promptTemplate}`,
      },
    ],
    temperature: endpoint.temperature,
    max_tokens: endpoint.maxTokens,
    user: userId,
  };

  if (debug) {
    console.log(`[${label}] Request (non-streaming): ${JSON.stringify(body)}`);
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
  const tokensPerSecond =
    latencyMs > 0 && completionTokens > 0
      ? Math.round((completionTokens / (latencyMs / 1000)) * 100) / 100
      : 0;

  insertRun(db, {
    configLabel: label,
    model,
    timestamp: new Date().toISOString(),
    promptTokens,
    completionTokens,
    totalTokens,
    latencyMs,
    tokensPerSecond,
    timeToFirstTokenMs: null,
    httpStatus,
    errorMessage,
  });

  if (errorMessage) {
    console.error(`[${label}] Failed: ${errorMessage}`);
  } else {
    console.log(
      `[${label}] OK — ${tokensPerSecond.toFixed(1)} TPS (non-streaming), ${latencyMs}ms, ${completionTokens} tokens`,
    );
  }
}

function parseSSELine(
  line: string,
  handler: (parsed: Record<string, unknown>) => void,
): void {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data: ")) return;
  const data = trimmed.slice(6);
  if (data === "[DONE]") return;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(data) as Record<string, unknown>;
  } catch {
    return;
  }
  handler(parsed);
}
