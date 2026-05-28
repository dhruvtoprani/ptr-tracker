import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { recalculateAppState } from "../shared/rules";
import type { AppState } from "../shared/types";
import { createSeedState } from "./seedData";

const DB_PATH = process.env.VERCEL
  ? "/tmp/pathway-command-center.db"
  : resolve(process.cwd(), "data", "pathway-command-center.db");

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

function normalizeState(input: AppState): AppState {
  return recalculateAppState({
    ...input,
    updatedAt: input.updatedAt || new Date().toISOString()
  });
}

export function bootstrapState() {
  const row = db.prepare("SELECT data FROM app_state WHERE id = 1").get() as { data: string } | undefined;
  if (!row) {
    const seed = normalizeState(createSeedState());
    db.prepare("INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?)").run(
      JSON.stringify(seed),
      seed.updatedAt
    );
  }
}

export function getState(): AppState {
  const row = db.prepare("SELECT data FROM app_state WHERE id = 1").get() as { data: string } | undefined;
  if (!row) {
    const seed = normalizeState(createSeedState());
    saveState(seed);
    return seed;
  }

  const parsed = JSON.parse(row.data) as AppState;
  return normalizeState(parsed);
}

export function saveState(state: AppState): AppState {
  const normalized = normalizeState(state);
  db.prepare("INSERT OR REPLACE INTO app_state (id, data, updated_at) VALUES (1, ?, ?)").run(
    JSON.stringify(normalized),
    normalized.updatedAt
  );
  return normalized;
}

export function resetStateWithSeed(): AppState {
  const seed = normalizeState(createSeedState());
  return saveState(seed);
}
