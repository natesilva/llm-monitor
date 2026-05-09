import { loadConfig } from "../shared/config";

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

  console.log(`Registering OS-level cron job:`);
  console.log(`  Name:     llm_monitor`);
  console.log(`  Schedule: ${config.bench.schedule}`);
  console.log(`  CWD:      ${process.cwd()}`);

  (Bun.cron as any)(
    "llm_monitor",
    config.bench.schedule,
    "LLM_Monitor_Bench",
    () => {
      console.log(
        "Cron tick — this callback runs when the scheduler invokes the process",
      );
    },
  );

  console.log("Cron job registered. The bench script will run on schedule.");
  console.log("For immediate testing, run: bun run bench");
}

main().catch((err) => {
  console.error("Failed to register cron job:", err);
  process.exit(1);
});
