import type {
  BenchmarkRun,
  ComparisonResponse,
  ComparisonSeries,
  ConfigStats,
  DataPointsResponse,
  MetricsDataPoint,
  MetricsResponse,
} from "../shared/types";
import type { Database } from "./schema";

export function insertRun(db: Database, run: Omit<BenchmarkRun, "id">): void {
  db.run(
    `INSERT INTO benchmark_runs (config_label, model, timestamp, prompt_tokens, comp_tokens, total_tokens, latency_ms, tps, http_status, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      run.configLabel,
      run.model,
      run.timestamp,
      run.promptTokens,
      run.completionTokens,
      run.totalTokens,
      run.latencyMs,
      run.tokensPerSecond,
      run.httpStatus,
      run.errorMessage ?? null,
    ],
  );
}

export function getConfigsWithData(db: Database): string[] {
  const rows = db
    .query(
      "SELECT DISTINCT config_label FROM benchmark_runs ORDER BY config_label",
    )
    .all() as { config_label: string }[];
  return rows.map((r) => r.config_label);
}

export function getMetricsForConfig(
  db: Database,
  configLabel: string,
  hours: number = 48,
): MetricsResponse {
  const since = new Date(Date.now() - hours * 3600_000).toISOString();

  const rows = db
    .query(
      `SELECT timestamp, tps, latency_ms, http_status
       FROM benchmark_runs
       WHERE config_label = ? AND timestamp >= ?
       ORDER BY timestamp`,
    )
    .all(configLabel, since) as {
    timestamp: string;
    tps: number;
    latency_ms: number;
    http_status: number;
  }[];

  const dataPoints: MetricsDataPoint[] = rows.map((r) => ({
    timestamp: r.timestamp,
    tps: r.tps,
    latencyMs: r.latency_ms,
    httpStatus: r.http_status,
  }));

  const stats = computeStats(
    rows.map((r) => ({
      tps: r.tps,
      latencyMs: r.latency_ms,
      httpStatus: r.http_status,
    })),
  );

  return { config: configLabel, hours, dataPoints, stats };
}

export function getComparisonMetrics(
  db: Database,
  hours: number = 24,
  configs?: string[],
): ComparisonResponse {
  const since = new Date(Date.now() - hours * 3600_000).toISOString();

  let rows: { config_label: string; timestamp: string; tps: number }[];

  if (configs && configs.length > 0) {
    const placeholders = configs.map(() => "?").join(",");
    rows = db
      .query(
        `SELECT config_label, timestamp, tps
         FROM benchmark_runs
         WHERE timestamp >= ? AND config_label IN (${placeholders})
         ORDER BY config_label, timestamp`,
      )
      .all(since, ...configs) as {
      config_label: string;
      timestamp: string;
      tps: number;
    }[];
  } else {
    rows = db
      .query(
        `SELECT config_label, timestamp, tps
         FROM benchmark_runs
         WHERE timestamp >= ?
         ORDER BY config_label, timestamp`,
      )
      .all(since) as { config_label: string; timestamp: string; tps: number }[];
  }

  const grouped = new Map<string, { timestamp: string; tps: number }[]>();
  for (const row of rows) {
    if (!grouped.has(row.config_label)) grouped.set(row.config_label, []);
    grouped
      .get(row.config_label)
      ?.push({ timestamp: row.timestamp, tps: row.tps });
  }

  const series: ComparisonSeries[] = [];
  for (const [config, points] of grouped) {
    series.push({ config, dataPoints: points });
  }

  return { hours, series };
}

export function getDataPointsForConfig(
  db: Database,
  configLabel: string,
  hours: number = 48,
  limit: number = 50,
): DataPointsResponse {
  const since = new Date(Date.now() - hours * 3600_000).toISOString();

  const rows = db
    .query(
      `SELECT timestamp, tps, latency_ms, http_status
       FROM benchmark_runs
       WHERE config_label = ? AND timestamp >= ?
       ORDER BY timestamp DESC
       LIMIT ?`,
    )
    .all(configLabel, since, limit) as {
    timestamp: string;
    tps: number;
    latency_ms: number;
    http_status: number;
  }[];

  const dataPoints: MetricsDataPoint[] = rows.map((r) => ({
    timestamp: r.timestamp,
    tps: r.tps,
    latencyMs: r.latency_ms,
    httpStatus: r.http_status,
  }));

  return { config: configLabel, hours, dataPoints };
}

export function pruneOldRuns(db: Database, retentionDays: number): number {
  const cutoff = new Date(Date.now() - retentionDays * 86400_000).toISOString();
  const result = db.run("DELETE FROM benchmark_runs WHERE timestamp < ?", [
    cutoff,
  ]);
  return result.changes;
}

function computeStats(
  rows: { tps: number; latencyMs: number; httpStatus: number }[],
): ConfigStats {
  if (rows.length === 0) {
    return {
      avgTps: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      successRate: 0,
      tpsStdDev: 0,
    };
  }

  const tpsValues = rows.map((r) => r.tps);
  const latencyValues = rows.map((r) => r.latencyMs).sort((a, b) => a - b);
  const successCount = rows.filter(
    (r) => r.httpStatus >= 200 && r.httpStatus < 300,
  ).length;

  const avgTps = tpsValues.reduce((a, b) => a + b, 0) / tpsValues.length;
  const tpsStdDev = Math.sqrt(
    tpsValues.reduce((sum, v) => sum + (v - avgTps) ** 2, 0) / tpsValues.length,
  );

  const p50 = percentile(latencyValues, 50);
  const p95 = percentile(latencyValues, 95);

  return {
    avgTps: round2(avgTps),
    p50LatencyMs: Math.round(p50),
    p95LatencyMs: Math.round(p95),
    successRate: round2(successCount / rows.length),
    tpsStdDev: round2(tpsStdDev),
  };
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
