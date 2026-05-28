import {
  type ActivityLevel,
  type ActivityState,
  type AppState,
  type AssignmentType,
  type AttendanceRecord,
  type RiskState,
  type Student
} from "./types";

const ACTIVITY_EXPLANATIONS: Record<ActivityLevel, string> = {
  Excellent:
    "Excellent activity: strong attendance, current assignments, and recent advising engagement.",
  High: "High activity: mostly current with minor gaps.",
  Moderate: "Moderate activity: some engagement, but assignments or attendance need attention.",
  Low: "Low activity: multiple missing items or inconsistent attendance.",
  Inactive: "Inactive: little recent engagement. Consider outreach or archive."
};

const STATUS_POINTS: Record<string, number> = {
  "Not Started": 0,
  "In Progress": 4,
  Submitted: 7,
  "Needs Revision": 3,
  Complete: 10,
  Excused: 4,
  Missing: -12
};

const ATTENDANCE_POINTS: Record<string, number> = {
  Present: 8,
  Late: 4,
  Excused: 2,
  Absent: -8,
  "No Show": -12
};

const DAY_MS = 1000 * 60 * 60 * 24;

function daysSince(dateISO?: string): number | null {
  if (!dateISO) {
    return null;
  }
  const parsed = Date.parse(dateISO);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.floor((Date.now() - parsed) / DAY_MS);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function levelFromScore(score: number): ActivityLevel {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "High";
  if (score >= 50) return "Moderate";
  if (score >= 25) return "Low";
  return "Inactive";
}

function mapLevelWithExplanation(level: ActivityLevel): string {
  return ACTIVITY_EXPLANATIONS[level];
}

export function getMissingAssignmentCount(student: Student): number {
  return Object.values(student.assignments).filter((record) => record.status === "Missing").length;
}

export function getNoShowCount(student: Student): number {
  return student.attendance.filter((item) => item.status === "No Show").length;
}

export function getLastAdvisingDate(student: Student): string | null {
  const sorted = [...student.advisingSessions].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return sorted[0]?.date ?? null;
}

export function getAttendanceRate(student: Student): number {
  if (!student.attendance.length) {
    return 0;
  }
  const positiveStatuses = new Set(["Present", "Late", "Excused"]);
  const positives = student.attendance.filter((item) => positiveStatuses.has(item.status)).length;
  return Math.round((positives / student.attendance.length) * 100);
}

export function getStudentCompletionRate(student: Student, assignments: AssignmentType[]): number {
  const activeAssignments = assignments.filter((assignment) => !assignment.archived);
  if (!activeAssignments.length) {
    return 0;
  }
  const doneStatuses = new Set(["Complete", "Submitted"]);
  const completed = activeAssignments.filter((assignment) => {
    const record = student.assignments[assignment.id];
    return record && doneStatuses.has(record.status);
  }).length;
  return Math.round((completed / activeAssignments.length) * 100);
}

function getRecentAttendancePoints(attendance: AttendanceRecord[]): number {
  const recent = [...attendance]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 5);
  if (!recent.length) {
    return 0;
  }

  const raw = recent.reduce((sum, record) => sum + (ATTENDANCE_POINTS[record.status] ?? 0), 0);
  const normalized = (raw / 40) * 35;
  return Math.round(clamp(normalized, 0, 35));
}

function getAssignmentPoints(student: Student, assignments: AssignmentType[]): number {
  const activeAssignments = assignments.filter((assignment) => !assignment.archived);
  if (!activeAssignments.length) {
    return 0;
  }

  let raw = 0;
  for (const assignment of activeAssignments) {
    const record = student.assignments[assignment.id];
    if (!record) continue;

    if (record.status === "Not Started") {
      const due = Date.parse(assignment.dueDate);
      if (!Number.isNaN(due) && due < Date.now()) {
        raw += -8;
        continue;
      }
    }

    raw += STATUS_POINTS[record.status] ?? 0;
  }

  const maxRaw = activeAssignments.length * 10;
  const normalized = maxRaw > 0 ? (raw / maxRaw) * 40 : 0;
  return Math.round(clamp(normalized, 0, 40));
}

function getAdvisingPoints(student: Student): number {
  const lastDate = getLastAdvisingDate(student);
  let points = 0;
  const age = daysSince(lastDate ?? undefined);
  if (age !== null) {
    if (age <= 14) {
      points += 15;
    } else if (age <= 30) {
      points += 8;
    }
  }

  const missedFollowups = student.advisingSessions.some((session) => {
    if (!session.followUpDate || session.followUpCompleted) {
      return false;
    }
    const followupAge = daysSince(session.followUpDate);
    return followupAge !== null && followupAge > 0;
  });

  if (missedFollowups) {
    points -= 8;
  }

  return Math.round(clamp(points, 0, 15));
}

function getEngagementPoints(student: Student): number {
  let points = 0;
  if (student.linkedinUrl.trim().length > 0) {
    points += 2;
  }
  if (student.major.trim().length > 0 && student.year.trim().length > 0) {
    points += 2;
  }
  if (student.profile.mentorNames.trim().length > 0 || /^yes$/i.test(student.profile.mentorContacted)) {
    points += 4;
  }
  if (student.engagementFlags.openConcernFlag) {
    points -= 8;
  }
  return Math.round(clamp(points, 0, 10));
}

export function calculateActivityScore(student: Student, assignments: AssignmentType[]): ActivityState {
  const assignmentPoints = getAssignmentPoints(student, assignments);
  const attendancePoints = getRecentAttendancePoints(student.attendance);
  const advisingPoints = getAdvisingPoints(student);
  const engagementPoints = getEngagementPoints(student);

  const score = clamp(assignmentPoints + attendancePoints + advisingPoints + engagementPoints, 0, 100);
  const computedLevel = levelFromScore(score);

  return {
    computedScore: score,
    computedLevel,
    explanation: mapLevelWithExplanation(computedLevel),
    manualOverride: student.activity.manualOverride,
    overrideLevel: student.activity.overrideLevel,
    overrideReason: student.activity.overrideReason
  };
}

export function calculateDropOffRisk(student: Student, _assignments: AssignmentType[]): RiskState {
  if (student.dropOffRisk.manuallyMarkedDropped) {
    return {
      level: "Dropped",
      reasons: ["Dropped: mentor manually marked this student as dropped."],
      manuallyMarkedDropped: true
    };
  }

  const attendance = [...student.attendance].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const recentNoShows = attendance.slice(0, 3).filter((record) => record.status === "No Show").length;
  if (recentNoShows === 3) {
    return {
      level: "Dropped",
      reasons: ["Dropped: three consecutive no-shows."],
      manuallyMarkedDropped: false
    };
  }

  if (student.archived && student.archiveReason === "Stopped attending") {
    return {
      level: "Dropped",
      reasons: ["Dropped: archived due to repeated no-shows."],
      manuallyMarkedDropped: false
    };
  }

  const missingAssignments = getMissingAssignmentCount(student);
  const noShowCount = getNoShowCount(student);
  const recentAbsences = attendance.slice(0, 5).filter((record) => record.status === "Absent").length;
  const daysSinceAdvising = daysSince(getLastAdvisingDate(student) ?? undefined);
  const activityScore = student.activity.computedScore;

  const highCriteria: string[] = [];
  if (recentAbsences >= 2) highCriteria.push("two recent absences");
  if (missingAssignments >= 2) highCriteria.push("two missing assignments");
  if (noShowCount >= 1) highCriteria.push("a no-show");
  if (daysSinceAdvising !== null && daysSinceAdvising > 45) {
    highCriteria.push("no advising in 45+ days");
  }
  if (activityScore < 30) highCriteria.push("activity score below 30");

  if (highCriteria.length >= 2) {
    return {
      level: "High",
      reasons: [`High risk: ${highCriteria.slice(0, 3).join(", ")}.`],
      manuallyMarkedDropped: false
    };
  }

  const watchReasons: string[] = [];
  if (recentAbsences >= 1) watchReasons.push("one recent absence");
  if (missingAssignments >= 1) watchReasons.push("one missing assignment");
  if (daysSinceAdvising !== null && daysSinceAdvising > 30) watchReasons.push("no advising in 30+ days");
  if (activityScore < 50) watchReasons.push("activity score below 50");

  if (watchReasons.length >= 1) {
    return {
      level: "Watch",
      reasons: [`Watch: ${watchReasons.slice(0, 3).join(" and ")}.`],
      manuallyMarkedDropped: false
    };
  }

  return {
    level: "Low",
    reasons: ["Low risk: recent attendance, current assignments, and no major concerns."],
    manuallyMarkedDropped: false
  };
}

export function recalculateStudent(student: Student, assignments: AssignmentType[]): Student {
  const activity = calculateActivityScore(student, assignments);
  const withActivity = {
    ...student,
    activity
  };
  const dropOffRisk = calculateDropOffRisk(withActivity, assignments);
  return {
    ...withActivity,
    dropOffRisk
  };
}

export function recalculateAllStudents(students: Student[], assignments: AssignmentType[]): Student[] {
  return students.map((student) => recalculateStudent(student, assignments));
}

export function recalculateAppState(state: AppState): AppState {
  return {
    ...state,
    students: recalculateAllStudents(state.students, state.assignments),
    updatedAt: new Date().toISOString()
  };
}
