export interface EndpointConfig {
  label: string;
  baseUrl: string;
  apiKeyEnvVar: string;
  model: string;
  promptTemplate?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  streaming?: boolean;
}

export interface BenchConfig {
  schedule: string;
  endpoints: EndpointConfig[];
}

export interface WebConfig {
  port: number;
  host: string;
}

export interface DbConfig {
  path: string;
  retentionDays: number;
}

export interface AppConfig {
  bench: BenchConfig;
  web: WebConfig;
  db: DbConfig;
}

export interface BenchmarkRun {
  id?: number;
  configLabel: string;
  model: string;
  timestamp: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  tokensPerSecond: number;
  timeToFirstTokenMs: number | null;
  timeToFirst100TokensMs: number | null;
  httpStatus: number;
  errorMessage?: string;
}

export interface MetricsDataPoint {
  timestamp: string;
  tps: number;
  latencyMs: number;
  httpStatus: number;
  ttftMs: number | null;
  tt100tMs: number | null;
}

export interface ConfigStats {
  avgTps: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  successRate: number;
  tpsStdDev: number;
  p50TtftMs: number | null;
  p95TtftMs: number | null;
  avgTt100tMs: number | null;
}

export interface MetricsResponse {
  config: string;
  hours: number;
  dataPoints: MetricsDataPoint[];
  stats: ConfigStats;
}

export interface ComparisonDataPoint {
  timestamp: string;
  tps: number;
  tt100tMs: number | null;
}

export interface ComparisonSeries {
  config: string;
  dataPoints: ComparisonDataPoint[];
}

export interface ComparisonResponse {
  hours: number;
  series: ComparisonSeries[];
}

export interface DataPointsResponse {
  config: string;
  hours: number;
  dataPoints: MetricsDataPoint[];
}

export interface ResolvedEndpoint extends EndpointConfig {
  apiKey: string;
}
