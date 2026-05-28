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

app.use(cors());
app.use(express.json({ limit: "5mb" }));

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

app.get("/api/health", (_req, res) => {
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
