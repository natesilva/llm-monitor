import { loadConfig } from "../shared/config";
import { initDb } from "../db/schema";
import { pruneOldRuns } from "../db/queries";
import { loadEndpoints } from "./config";
import { runAllEndpoints } from "./scheduler";

async function main() {
  let rawConfig;
  try {
    // @ts-ignore - config.ts is created by the user from config.example.ts
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
  await runAllEndpoints(db, endpoints);

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
