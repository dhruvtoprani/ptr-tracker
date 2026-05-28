import { randomUUID, timingSafeEqual } from "node:crypto";
import cors from "cors";
import express from "express";
import { z } from "zod";
import { buildDashboardMetrics, buildStudentExportRow, generateSupervisorSummary } from "../shared/metrics";
import { recalculateAppState } from "../shared/rules";
import type { AppState } from "../shared/types";
import { bootstrapState, getState, resetStateWithSeed, saveState } from "./db";

bootstrapState();

const app = express();
const PORT = 8787;
const AUTH_USERNAME = process.env.APP_USERNAME ?? "mentor";
const AUTH_PASSWORD = process.env.APP_PASSWORD ?? "pathway2026";
const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS ?? "43200");
const activeSessions = new Map<string, number>();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

const AppStateSchema = z.object({
  students: z.array(z.any()),
  assignments: z.array(z.any()),
  attendanceSessions: z.array(z.any()),
  updatedAt: z.string().optional()
});

function toCsv(rows: Record<string, string | number | boolean | null | undefined>[]): string {
  if (!rows.length) {
    return "";
  }
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number | boolean | null | undefined) => {
    const text = value == null ? "" : String(value);
    if (text.includes(",") || text.includes("\n") || text.includes('"')) {
      return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escape(row[header])).join(","));
  }
  return lines.join("\n");
}

function safeCompare(value: string, expected: string): boolean {
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

function getBearerToken(req: express.Request): string | null {
  const raw = req.header("Authorization");
  if (!raw || !raw.startsWith("Bearer ")) {
    return null;
  }
  return raw.slice("Bearer ".length).trim();
}

function isAuthorized(req: express.Request): boolean {
  const token = getBearerToken(req);
  if (!token) return false;
  const expiresAt = activeSessions.get(token);
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    activeSessions.delete(token);
    return false;
  }
  activeSessions.set(token, Date.now() + SESSION_TTL_SECONDS * 1000);
  return true;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  const { username, password } = parsed.data;
  const usernameOk = safeCompare(username, AUTH_USERNAME);
  const passwordOk = safeCompare(password, AUTH_PASSWORD);

  if (!usernameOk || !passwordOk) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  const token = randomUUID();
  activeSessions.set(token, Date.now() + SESSION_TTL_SECONDS * 1000);
  res.json({
    token,
    username: AUTH_USERNAME,
    expiresInSeconds: SESSION_TTL_SECONDS
  });
});

app.use("/api", (req, res, next) => {
  if (req.path === "/health" || req.path === "/auth/login") {
    next();
    return;
  }

  if (!isAuthorized(req)) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  next();
});

app.post("/api/auth/logout", (req, res) => {
  const token = getBearerToken(req);
  if (token) {
    activeSessions.delete(token);
  }
  res.json({ ok: true });
});

app.get("/api/state", (_req, res) => {
  const state = saveState(getState());
  res.json(state);
});

app.put("/api/state", (req, res) => {
  const parsed = AppStateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid state payload", details: parsed.error.issues });
    return;
  }

  const nextState = recalculateAppState(parsed.data as AppState);
  const saved = saveState(nextState);
  res.json(saved);
});

app.post("/api/reset", (_req, res) => {
  const reset = resetStateWithSeed();
  res.json(reset);
});

app.get("/api/dashboard-metrics", (_req, res) => {
  const state = getState();
  res.json(buildDashboardMetrics(state));
});

app.get("/api/supervisor-summary", (_req, res) => {
  const state = getState();
  res.json({ summary: generateSupervisorSummary(state) });
});

app.get("/api/export/json", (_req, res) => {
  const state = getState();
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=pathway-command-center.json");
  res.send(JSON.stringify(state, null, 2));
});

app.get("/api/export/students.csv", (_req, res) => {
  const state = getState();
  const rows = state.students.map((student) => buildStudentExportRow(student, state.assignments));
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=student-summary.csv");
  res.send(toCsv(rows));
});

app.get("/api/export/assignments.csv", (_req, res) => {
  const state = getState();
  const rows: Record<string, string | number>[] = [];

  for (const student of state.students) {
    for (const assignment of state.assignments) {
      const record = student.assignments[assignment.id];
      if (!record) continue;
      rows.push({
        Student: student.name,
        Email: student.email,
        Assignment: assignment.name,
        DueDate: assignment.dueDate,
        Status: record.status,
        Grade: record.grade ?? "",
        SubmittedDate: record.submittedDate ?? "",
        ReviewedDate: record.reviewedDate ?? "",
        FeedbackNotes: record.feedbackNotes,
        InternalNotes: record.internalNotes,
        RevisionRequested: record.revisionRequested ? "Yes" : "No"
      });
    }
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=assignment-progress.csv");
  res.send(toCsv(rows));
});

app.get("/api/export/attendance.csv", (_req, res) => {
  const state = getState();
  const rows: Record<string, string | number>[] = [];
  for (const student of state.students) {
    for (const attendance of student.attendance) {
      rows.push({
        Student: student.name,
        Email: student.email,
        Date: attendance.date,
        SessionTitle: attendance.sessionTitle,
        Status: attendance.status,
        Notes: attendance.notes
      });
    }
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=attendance.csv");
  res.send(toCsv(rows));
});

app.get("/api/export/advising.csv", (_req, res) => {
  const state = getState();
  const rows: Record<string, string | number>[] = [];
  for (const student of state.students) {
    for (const session of student.advisingSessions) {
      rows.push({
        Student: student.name,
        Email: student.email,
        Date: session.date,
        SessionType: session.sessionType,
        Topic: session.topic,
        GoalsDiscussed: session.goalsDiscussed,
        MentorNotes: session.mentorNotes,
        ActionItems: session.actionItems,
        FollowUpDate: session.followUpDate ?? "",
        FollowUpCompleted: session.followUpCompleted ? "Yes" : "No",
        RelatedAssignmentId: session.relatedAssignmentId ?? ""
      });
    }
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=advising-sessions.csv");
  res.send(toCsv(rows));
});

app.listen(PORT, () => {
  console.log(`Pathway Command Center API listening on http://localhost:${PORT}`);
});
