import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const PROJECT_ROOT = resolve(import.meta.dir, "..", "..");
const DEFAULT_LOG_FILE = "data/cron.log";

export function createCronLogger(logFilePath?: string, projectRoot?: string) {
  const root = projectRoot ?? PROJECT_ROOT;
  const resolved = resolve(root, logFilePath ?? DEFAULT_LOG_FILE);
  const dir = dirname(resolved);
  mkdirSync(dir, { recursive: true });

  const header = `\n--- Cron run ${new Date().toISOString()} ---\n`;
  appendFileSync(resolved, header);

  function write(message: string) {
    appendFileSync(resolved, `${message}\n`);
  }

  return { write, logFilePath: resolved };
}

export function getDefaultLogFile(): string {
  return DEFAULT_LOG_FILE;
}
