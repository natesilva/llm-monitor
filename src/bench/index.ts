import { parseArgs } from "node:util";
import { pruneOldRuns } from "../db/queries";
import { initDb } from "../db/schema";
import { loadConfigFromYaml } from "../shared/config";
import { loadEndpoints } from "./config";
import { runAllEndpoints } from "./scheduler";

export async function runBench(debug = false, prompt?: string) {
  const config = await loadConfigFromYaml();
  const db = initDb(config.db.path);

  const endpoints = loadEndpoints(config.bench.endpoints);
  await runAllEndpoints(db, endpoints, debug, prompt);

  const pruned = pruneOldRuns(db, config.db.retentionDays);
  if (pruned > 0) {
    console.log(`Pruned ${pruned} old run(s)`);
  }

  db.close();
}

async function main() {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      debug: { type: "boolean" },
      help: { type: "boolean" },
      prompt: { type: "string" },
    },
    strict: true,
    allowPositionals: true,
  });

  if (values.help) {
    console.log(`Usage: bun run bench [options]

Options:
  --debug          Print full request and response details for each endpoint
  --prompt <text>  Specify the prompt text sent to each endpoint
  --help           Show this help message`);
    process.exit(0);
  }

  await runBench(values.debug ?? false, values.prompt);
}

if (import.meta.main) {
  try {
    await main();
  } catch (err) {
    console.error("Benchmark run failed:", err);
    process.exit(1);
  }
}
