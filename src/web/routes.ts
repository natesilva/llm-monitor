import { readFile } from "node:fs";
import { join } from "node:path";
import {
  getComparisonMetrics,
  getConfigsWithData,
  getDataPointsForConfig,
  getLatestTimestamp,
  getMetricsForConfig,
} from "../db/queries";
import type { Database } from "../db/schema";
import type { AppConfig } from "../shared/types";

export function createRouter(db: Database, config: AppConfig) {
  const staticDir = join(import.meta.dir, "static");
  const activeLabels = config.bench.endpoints.map((e) => e.label);

  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const path = url.pathname;

    const res = await handleRoute(path, url);

    if (res.status >= 400) {
      console.error(`${req.method} ${path} -> ${res.status}`);
    }

    return res;
  };

  async function handleRoute(path: string, url: URL): Promise<Response> {
    if (path === "/api/configs") {
      const configs = getConfigsWithData(db, activeLabels);
      return Response.json({ configs });
    }

    if (path === "/api/metrics") {
      const label = url.searchParams.get("config");
      if (!label) {
        return Response.json(
          { error: "Missing config parameter" },
          { status: 400 },
        );
      }
      const hours = parseInt(url.searchParams.get("hours") ?? "48", 10);
      const metrics = getMetricsForConfig(db, label, hours);
      return Response.json(metrics);
    }

    if (path === "/api/metrics/compare") {
      const hours = parseInt(url.searchParams.get("hours") ?? "24", 10);
      const configsParam = url.searchParams.get("configs");
      const configs = configsParam
        ? configsParam.split(",").filter(Boolean)
        : undefined;
      const result = getComparisonMetrics(db, hours, configs);
      return Response.json(result);
    }

    if (path === "/api/latest-data") {
      const latestTimestamp = getLatestTimestamp(db);
      return Response.json({ latestTimestamp });
    }

    if (path === "/api/metrics/data-points") {
      const label = url.searchParams.get("config");
      if (!label) {
        return Response.json(
          { error: "Missing config parameter" },
          { status: 400 },
        );
      }
      const hours = parseInt(url.searchParams.get("hours") ?? "48", 10);
      const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
      const result = getDataPointsForConfig(db, label, hours, limit);
      return Response.json(result);
    }

    if (path === "/" || path === "/index.html") {
      return await serveFile(join(staticDir, "index.html"), "text/html");
    }

    if (path.startsWith("/")) {
      const filePath = join(staticDir, path);
      const contentType = guessContentType(path);
      return await serveFile(filePath, contentType);
    }

    return new Response("Not Found", { status: 404 });
  }

  function serveFile(filePath: string, contentType: string): Promise<Response> {
    return new Promise((resolve) => {
      readFile(filePath, (err, data) => {
        if (err) {
          resolve(new Response("Not Found", { status: 404 }));
          return;
        }
        resolve(
          new Response(data, {
            headers: { "Content-Type": contentType },
          }),
        );
      });
    });
  }
}

function guessContentType(path: string): string {
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".ico")) return "image/x-icon";
  return "application/octet-stream";
}
