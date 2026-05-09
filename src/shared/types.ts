export interface EndpointConfig {
  label: string;
  baseUrl: string;
  apiKeyEnvVar: string;
  model: string;
  promptTemplate?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
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
  httpStatus: number;
  errorMessage?: string;
}

export interface MetricsDataPoint {
  timestamp: string;
  tps: number;
  latencyMs: number;
  httpStatus: number;
}

export interface ConfigStats {
  avgTps: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  successRate: number;
  tpsStdDev: number;
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
}

export interface ComparisonSeries {
  config: string;
  dataPoints: ComparisonDataPoint[];
}

export interface ComparisonResponse {
  hours: number;
  series: ComparisonSeries[];
}

export interface ResolvedEndpoint extends EndpointConfig {
  apiKey: string;
}
