import { join } from "node:path";
import { loadConfigFromYaml } from "../shared/config";
import { createCronLogger } from "./cron-logger";
import { runBench } from "./index";

const CRON_JOB_NAME = "LLM_Monitor_Bench";

async function isCronJobRegistered(name: string): Promise<boolean> {
  if (process.platform === "darwin") {
    try {
      const proc = Bun.spawn(["launchctl", "list"], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const text = await new Response(proc.stdout).text();
      await proc.exited;
      return text.includes(`bun.cron.${name}`);
    } catch {
      return false;
    }
  }

  if (process.platform === "linux") {
    try {
      const proc = Bun.spawn(["crontab", "-l"], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const text = await new Response(proc.stdout).text();
      await proc.exited;
      return text.includes(name);
    } catch {
      return false;
    }
  }

  return false;
}

async function register() {
  const alreadyRegistered = await isCronJobRegistered(CRON_JOB_NAME);

  const config = await loadConfigFromYaml();
  const workerPath = join(import.meta.dir, "cron-worker.ts");

  await Bun.cron(workerPath, config.bench.schedule, CRON_JOB_NAME);

  if (alreadyRegistered) {
    console.log("Cron job updated.");
  } else {
    console.log("Cron job registered.");
  }
  console.log(`  Title:    ${CRON_JOB_NAME}`);
  console.log(`  Schedule: ${config.bench.schedule}`);
  console.log(`  Worker:   ${workerPath}`);
}

async function unregister() {
  const wasRegistered = await isCronJobRegistered(CRON_JOB_NAME);

  if (!wasRegistered) {
    console.log(`No cron job found with title "${CRON_JOB_NAME}".`);
    return;
  }

  Bun.cron.remove(CRON_JOB_NAME);
  console.log("Cron job removed.");
  console.log(`  Title: ${CRON_JOB_NAME}`);
}

async function status() {
  const registered = await isCronJobRegistered(CRON_JOB_NAME);

  if (!registered) {
    console.log(`No cron job registered with title "${CRON_JOB_NAME}".`);
    console.log("To register one, run: bun run cron register");
    return;
  }

  const config = await loadConfigFromYaml();
  const workerPath = join(import.meta.dir, "cron-worker.ts");

  console.log("Cron job is registered.");
  console.log(`  Title:    ${CRON_JOB_NAME}`);
  console.log(`  Schedule: ${config.bench.schedule}`);
  console.log(`  Worker:   ${workerPath}`);
}

async function run() {
  const config = await loadConfigFromYaml();
  const logger = createCronLogger(config.bench.logFile);
  const debug = config.bench.debug ?? false;

  console.log(`Running benchmark (debug: ${debug})...`);
  console.log(`  Log file: ${logger.logFilePath}`);

  try {
    await runBench(debug);
    logger.write("[cron run] Benchmark run complete");
    console.log("Benchmark run complete.");
  } catch (err) {
    const errMsg = `[cron run] Benchmark run failed: ${err instanceof Error ? err.message : err}`;
    console.error(errMsg);
    logger.write(errMsg);
    process.exit(1);
  }
}

function printUsage() {
  console.log("Usage: bun run cron <subcommand>");
  console.log();
  console.log("Subcommands:");
  console.log(
    "  register    Register (or re-register) the scheduled benchmark cron job",
  );
  console.log("  unregister  Remove the scheduled benchmark cron job");
  console.log("  status      Check whether the cron job is registered");
  console.log(
    "  run         Manually run the benchmark via the cron worker path",
  );
}

const subcommand = process.argv[2];

switch (subcommand) {
  case "register":
    try {
      await register();
    } catch (err) {
      console.error("Failed to register cron job:", err);
      process.exit(1);
    }
    break;
  case "unregister":
    try {
      await unregister();
    } catch (err) {
      console.error("Failed to unregister cron job:", err);
      process.exit(1);
    }
    break;
  case "status":
    try {
      await status();
    } catch (err) {
      console.error("Failed to check cron job status:", err);
      process.exit(1);
    }
    break;
  case "run":
    try {
      await run();
    } catch (err) {
      console.error("Failed to run benchmark:", err);
      process.exit(1);
    }
    break;
  default:
    printUsage();
    process.exit(1);
}
