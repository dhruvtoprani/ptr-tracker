import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { recalculateAllStudents } from "../shared/rules.js";
import type { AppState } from "../shared/types.js";

const PRIVATE_SEED_FILE_DEFAULT = resolve(process.cwd(), "data", "private", "seed-state.json");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLikelyAppState(value: unknown): value is AppState {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value.students) &&
    Array.isArray(value.assignments) &&
    Array.isArray(value.attendanceSessions)
  );
}

function parseSeedState(raw: string, sourceName: string): AppState | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isLikelyAppState(parsed)) {
      console.warn(`[seed] Ignoring ${sourceName}: payload is not a valid AppState shape.`);
      return null;
    }

    return {
      ...parsed,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString()
    };
  } catch (error) {
    console.warn(`[seed] Failed to parse ${sourceName}: ${error instanceof Error ? error.message : "unknown error"}`);
    return null;
  }
}

function loadSeedFromEnvironment(): AppState | null {
  const encoded = process.env.PTR_SEED_STATE_B64?.trim();
  if (encoded) {
    try {
      const decoded = Buffer.from(encoded, "base64").toString("utf8");
      const state = parseSeedState(decoded, "PTR_SEED_STATE_B64");
      if (state) return state;
    } catch (error) {
      console.warn(
        `[seed] Failed to decode PTR_SEED_STATE_B64: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }
  }

  const inlineJson = process.env.PTR_SEED_STATE_JSON?.trim();
  if (inlineJson) {
    const state = parseSeedState(inlineJson, "PTR_SEED_STATE_JSON");
    if (state) return state;
  }

  return null;
}

function loadSeedFromPrivateFile(): AppState | null {
  const configuredPath = process.env.PTR_SEED_STATE_FILE?.trim();
  const candidatePath = configuredPath ? resolve(configuredPath) : PRIVATE_SEED_FILE_DEFAULT;

  if (!existsSync(candidatePath)) {
    return null;
  }

  try {
    const fileContents = readFileSync(candidatePath, "utf8");
    return parseSeedState(fileContents, candidatePath);
  } catch (error) {
    console.warn(`[seed] Failed to read ${candidatePath}: ${error instanceof Error ? error.message : "unknown error"}`);
    return null;
  }
}

function createEmptySeedState(): AppState {
  return {
    students: [],
    assignments: [],
    attendanceSessions: [],
    updatedAt: new Date().toISOString()
  };
}

function normalizeSeedState(state: AppState): AppState {
  return {
    ...state,
    students: recalculateAllStudents(state.students, state.assignments),
    updatedAt: new Date().toISOString()
  };
}

export function createSeedState(): AppState {
  const fromEnv = loadSeedFromEnvironment();
  if (fromEnv) {
    return normalizeSeedState(fromEnv);
  }

  const fromFile = loadSeedFromPrivateFile();
  if (fromFile) {
    return normalizeSeedState(fromFile);
  }

  return createEmptySeedState();
}
