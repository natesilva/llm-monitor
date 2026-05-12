import { pruneOldRuns } from "../db/queries";
import { initDb } from "../db/schema";
import { loadConfigFromYaml } from "../shared/config";
import { createRouter } from "./routes";

async function main() {
  const config = await loadConfigFromYaml();
  const db = initDb(config.db.path);

  pruneOldRuns(db, config.db.retentionDays);

  const router = createRouter(db, config);

  const server = Bun.serve({
    port: config.web.port,
    hostname: config.web.host,
    fetch: router,
  });

  console.log(
    `[${new Date().toLocaleTimeString()}] llm-monitor-web listening on http://${config.web.host}:${config.web.port}`,
  );

  process.on("SIGTERM", () => {
    console.log("Shutting down...");
    server.stop();
    db.close();
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("Shutting down...");
    server.stop();
    db.close();
    process.exit(0);
  });
}

try {
  await main();
} catch (err) {
  console.error("Web server failed to start:", err);
  process.exit(1);
}
