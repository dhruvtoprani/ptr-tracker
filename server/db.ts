import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { recalculateAppState } from "../shared/rules.js";
import type { AppState } from "../shared/types.js";
import { createSeedState } from "./seedData.js";

type StateStore = {
  bootstrapState: () => void;
  getState: () => AppState;
  saveState: (state: AppState) => AppState;
  resetStateWithSeed: () => AppState;
};

const isVercelRuntime = Boolean(process.env.VERCEL);

function normalizeState(input: AppState): AppState {
  return recalculateAppState({
    ...input,
    updatedAt: input.updatedAt || new Date().toISOString()
  });
}

function createInMemoryStore(): StateStore {
  let memoryState: AppState | null = null;

  const ensureState = (): AppState => {
    if (!memoryState) {
      memoryState = normalizeState(createSeedState());
    }
    return memoryState;
  };

  return {
    bootstrapState() {
      ensureState();
    },
    getState() {
      return normalizeState(ensureState());
    },
    saveState(state) {
      memoryState = normalizeState(state);
      return memoryState;
    },
    resetStateWithSeed() {
      memoryState = normalizeState(createSeedState());
      return memoryState;
    }
  };
}

function createSqliteStore(): StateStore {
  const require = createRequire(import.meta.url);
  const betterSqlite3 = require("better-sqlite3") as typeof import("better-sqlite3");

  const dbPath = resolve(process.cwd(), "data", "pathway-command-center.db");
  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new betterSqlite3(dbPath);

  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const getRow = (): { data: string } | undefined =>
    db.prepare("SELECT data FROM app_state WHERE id = 1").get() as { data: string } | undefined;

  const upsert = (state: AppState) => {
    db.prepare("INSERT OR REPLACE INTO app_state (id, data, updated_at) VALUES (1, ?, ?)").run(
      JSON.stringify(state),
      state.updatedAt
    );
  };

  return {
    bootstrapState() {
      const row = getRow();
      if (!row) {
        const seed = normalizeState(createSeedState());
        upsert(seed);
      }
    },
    getState() {
      const row = getRow();
      if (!row) {
        const seed = normalizeState(createSeedState());
        upsert(seed);
        return seed;
      }
      return normalizeState(JSON.parse(row.data) as AppState);
    },
    saveState(state) {
      const normalized = normalizeState(state);
      upsert(normalized);
      return normalized;
    },
    resetStateWithSeed() {
      const seed = normalizeState(createSeedState());
      upsert(seed);
      return seed;
    }
  };
}

const store = isVercelRuntime ? createInMemoryStore() : createSqliteStore();

export const bootstrapState = store.bootstrapState;
export const getState = store.getState;
export const saveState = store.saveState;
export const resetStateWithSeed = store.resetStateWithSeed;
