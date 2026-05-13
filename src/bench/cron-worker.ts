import { join, resolve } from "node:path";
import dotenv from "dotenv";
import { loadConfigFromYaml } from "../shared/config";
import { createCronLogger } from "./cron-logger";
import { runBench } from "./index";

const PROJECT_ROOT = resolve(import.meta.dir, "..", "..");

dotenv.config({ path: join(PROJECT_ROOT, ".env") });

export default {
  async scheduled(controller: Bun.CronController) {
    const config = await loadConfigFromYaml();
    const logger = createCronLogger(config.bench.logFile);

    const msg = `[cron] Scheduled run at ${new Date(controller.scheduledTime).toISOString()}`;
    console.log(msg);
    logger.write(msg);

    try {
      await runBench(config.bench.debug ?? false);
      logger.write("[cron] Benchmark run complete");
    } catch (err) {
      const errMsg = `[cron] Benchmark run failed: ${err instanceof Error ? err.message : err}`;
      console.error(errMsg);
      logger.write(errMsg);
    }
  },
};
