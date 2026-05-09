import Database from "bun:sqlite";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

export function initDb(dbPath: string): Database {
  const resolved = isAbsolute(dbPath)
    ? dbPath
    : resolve(import.meta.dir, "../..", dbPath);
  const dir = join(resolved, "..");
  mkdirSync(dir, { recursive: true });

  const db = new Database(resolved);
  db.run("PRAGMA journal_mode = WAL;");

  const migrationsDir = join(import.meta.dir, "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    db.run(sql);
  }

  return db;
}

export type { Database };
