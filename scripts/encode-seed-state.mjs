import { readFileSync } from "node:fs";
import process from "node:process";

const inputPath = process.argv[2] ?? "data/private/seed-state.json";

try {
  const raw = readFileSync(inputPath, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || !Array.isArray(parsed.students) || !Array.isArray(parsed.assignments) || !Array.isArray(parsed.attendanceSessions)) {
    console.error("Input JSON must look like AppState: { students: [], assignments: [], attendanceSessions: [] }");
    process.exit(1);
  }

  const encoded = Buffer.from(JSON.stringify(parsed), "utf8").toString("base64");
  console.log("Copy this into Vercel environment variable PTR_SEED_STATE_B64:");
  console.log(encoded);
} catch (error) {
  console.error(`Failed to encode ${inputPath}: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exit(1);
}
