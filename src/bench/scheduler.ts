import type { Database } from "../db/schema";
import type { ResolvedEndpoint } from "../shared/types";
import { runEndpoint } from "./runner";

export async function runAllEndpoints(
  db: Database,
  endpoints: ResolvedEndpoint[],
): Promise<void> {
  console.log(`Benchmark run starting — ${endpoints.length} endpoint(s)`);

  for (const endpoint of endpoints) {
    try {
      await runEndpoint(db, endpoint);
    } catch (err) {
      console.error(
        `[${endpoint.label}] Unexpected error: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  console.log("Benchmark run complete");
}
