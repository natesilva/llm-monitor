import { join } from "node:path";
import dotenv from "dotenv";
import { runBench } from "./index";

const PROJECT_ROOT = join(import.meta.dir, "..", "..");

dotenv.config({ path: join(PROJECT_ROOT, ".env") });

export default {
  scheduled(controller: Bun.CronController) {
    console.log(
      `[cron] Scheduled run at ${new Date(controller.scheduledTime).toISOString()}`,
    );
    runBench().catch((err) => {
      console.error("[cron] Benchmark run failed:", err);
    });
  },
};
