import { parseArgs } from "node:util";
import { pruneOldRuns } from "../db/queries";
import { initDb } from "../db/schema";
import { loadConfig } from "../shared/config";
import { loadEndpoints } from "./config";
import { runAllEndpoints } from "./scheduler";

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

  const debug = values.debug ?? false;
  const prompt: string | undefined = values.prompt;

  let rawConfig: { default: import("../shared/types").AppConfig };
  try {
    // @ts-expect-error - config.ts is created by the user from config.example.ts
    rawConfig = await import("../../config.ts");
  } catch {
    console.error(
      "Error: config.ts not found. Copy config.example.ts to config.ts and edit it.",
    );
    process.exit(1);
  }
  const config = loadConfig(rawConfig.default);
  const db = initDb(config.db.path);

  const endpoints = loadEndpoints(config.bench.endpoints);
  await runAllEndpoints(db, endpoints, debug, prompt);

  const pruned = pruneOldRuns(db, config.db.retentionDays);
  if (pruned > 0) {
    console.log(`Pruned ${pruned} old run(s)`);
  }

  db.close();
}

main().catch((err) => {
  console.error("Benchmark run failed:", err);
  process.exit(1);
});
