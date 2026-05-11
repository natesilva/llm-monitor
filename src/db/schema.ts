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

  // Track applied migrations so each runs exactly once.
  db.run(`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);

  const applied = new Set(
    (db.query("SELECT name FROM _migrations").all() as { name: string }[]).map(
      (r) => r.name,
    ),
  );

  const migrationsDir = join(import.meta.dir, "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    db.run(sql);
    db.run("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)", [
      file,
      new Date().toISOString(),
    ]);
  }

  return db;
}

export type { Database };
