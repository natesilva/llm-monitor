import Database from "bun:sqlite";
import { readdirSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";

export function initDb(dbPath: string): Database {
  const dir = join(dbPath, "..");
  mkdirSync(dir, { recursive: true });

  const db = new Database(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");

  const migrationsDir = join(import.meta.dir, "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    db.exec(sql);
  }

  return db;
}

export type { Database };
