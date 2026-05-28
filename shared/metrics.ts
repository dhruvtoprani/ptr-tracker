import {
  type ActivityLevel,
  type AppState,
  type AssignmentType,
  type RiskLevel,
  type Student
} from "./types";
import {
  getAttendanceRate,
  getLastAdvisingDate,
  getMissingAssignmentCount,
  getNoShowCount,
  getStudentCompletionRate
} from "./rules";

export type DashboardMetrics = {
  totalActiveStudents: number;
  archivedStudents: number;
  assignmentCompletionRate: number;
  submittedPendingReview: number;
  missingAssignments: number;
  byActivityLevel: Record<ActivityLevel, number>;
  byRiskLevel: Record<RiskLevel, number>;
  attendanceRate: number;
  noShowCount: number;
  advisingSessionsLogged: number;
  missingLinkedin: number;
  missingMajorOrYear: number;
};

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, item) => sum + item, 0) / values.length);
}

function assignmentStats(students: Student[], assignments: AssignmentType[]) {
  const activeAssignments = assignments.filter((assignment) => !assignment.archived);
  if (!activeAssignments.length || !students.length) {
    return {
      completionRate: 0,
      submittedPendingReview: 0,
      missingAssignments: 0
    };
  }

  let totalPairs = 0;
  let completedPairs = 0;
  let submittedPendingReview = 0;
  let missingAssignments = 0;

  for (const student of students) {
    for (const assignment of activeAssignments) {
      const record = student.assignments[assignment.id];
      if (!record) continue;
      totalPairs += 1;
      if (record.status === "Complete") completedPairs += 1;
      if (record.status === "Submitted") submittedPendingReview += 1;
      if (record.status === "Missing") missingAssignments += 1;
    }
  }

  return {
    completionRate: totalPairs > 0 ? Math.round((completedPairs / totalPairs) * 100) : 0,
    submittedPendingReview,
    missingAssignments
  };
}

export function buildDashboardMetrics(state: AppState): DashboardMetrics {
  const activeStudents = state.students.filter((student) => !student.archived);
  const archivedStudents = state.students.filter((student) => student.archived);

  const byActivityLevel: Record<ActivityLevel, number> = {
    Excellent: 0,
    High: 0,
    Moderate: 0,
    Low: 0,
    Inactive: 0
  };

  const byRiskLevel: Record<RiskLevel, number> = {
    Low: 0,
    Watch: 0,
    High: 0,
    Dropped: 0
  };

  for (const student of activeStudents) {
    const level = student.activity.manualOverride && student.activity.overrideLevel
      ? student.activity.overrideLevel
      : student.activity.computedLevel;
    byActivityLevel[level] += 1;
    byRiskLevel[student.dropOffRisk.level] += 1;
  }

  const assignmentData = assignmentStats(activeStudents, state.assignments);

  return {
    totalActiveStudents: activeStudents.length,
    archivedStudents: archivedStudents.length,
    assignmentCompletionRate: assignmentData.completionRate,
    submittedPendingReview: assignmentData.submittedPendingReview,
    missingAssignments: assignmentData.missingAssignments,
    byActivityLevel,
    byRiskLevel,
    attendanceRate: average(activeStudents.map((student) => getAttendanceRate(student))),
    noShowCount: activeStudents.reduce((sum, student) => sum + getNoShowCount(student), 0),
    advisingSessionsLogged: activeStudents.reduce((sum, student) => sum + student.advisingSessions.length, 0),
    missingLinkedin: activeStudents.filter((student) => !student.linkedinUrl.trim()).length,
    missingMajorOrYear: activeStudents.filter(
      (student) => !student.major.trim() || !student.year.trim()
    ).length
  };
}

export function getStudentsNeedingAttention(students: Student[]): Student[] {
  return students
    .filter(
      (student) =>
        !student.archived &&
        (student.dropOffRisk.level === "High" ||
          student.dropOffRisk.level === "Watch" ||
          getMissingAssignmentCount(student) > 0)
    )
    .sort((a, b) => {
      const rank = (value: RiskLevel) => {
        if (value === "Dropped") return 4;
        if (value === "High") return 3;
        if (value === "Watch") return 2;
        return 1;
      };
      return rank(b.dropOffRisk.level) - rank(a.dropOffRisk.level);
    })
    .slice(0, 8);
}

export function getRecentlyAdvisedStudents(students: Student[]): Student[] {
  return students
    .filter((student) => !student.archived)
    .map((student) => ({
      student,
      lastAdvised: getLastAdvisingDate(student)
    }))
    .filter((item) => item.lastAdvised)
    .sort((a, b) => Date.parse(b.lastAdvised!) - Date.parse(a.lastAdvised!))
    .slice(0, 6)
    .map((item) => item.student);
}

export function generateSupervisorSummary(state: AppState): string {
  const metrics = buildDashboardMetrics(state);
  const activeStudents = state.students.filter((student) => !student.archived);
  const topInterests = activeStudents
    .flatMap((student) =>
      student.profile.researchInterests
        .split(",")
        .map((interest) => interest.trim())
        .filter(Boolean)
    )
    .reduce<Record<string, number>>((acc, interest) => {
      acc[interest] = (acc[interest] ?? 0) + 1;
      return acc;
    }, {});

  const interestSummary = Object.entries(topInterests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([interest]) => interest)
    .join(", ");

  const highOrExcellent = activeStudents.filter((student) => {
    const level = student.activity.manualOverride && student.activity.overrideLevel
      ? student.activity.overrideLevel
      : student.activity.computedLevel;
    return level === "High" || level === "Excellent";
  }).length;

  const watch = activeStudents.filter((student) => student.dropOffRisk.level === "Watch").length;
  const highRisk = activeStudents.filter((student) => student.dropOffRisk.level === "High").length;

  return `Current Pathway to Research tracking summary: ${metrics.totalActiveStudents} active students are being tracked. Assignment completion is currently ${metrics.assignmentCompletionRate}%. ${highOrExcellent} students are marked High or Excellent activity, ${watch} students are on Watch, and ${highRisk} students are High Risk. ${metrics.advisingSessionsLogged} advising sessions have been logged. The most common research interests are ${interestSummary || "still emerging"}. Immediate follow-up is recommended for students with repeated absences, missing assignments, or no advising session in the past 30 days.`;
}

export function buildStudentExportRow(student: Student, assignments: AssignmentType[]) {
  return {
    Name: student.name,
    Email: student.email,
    Major: student.major,
    Year: student.year,
    ActivityScore: student.activity.computedScore,
    ActivityLevel:
      student.activity.manualOverride && student.activity.overrideLevel
        ? `${student.activity.overrideLevel} (manual)`
        : student.activity.computedLevel,
    DropOffRisk: student.dropOffRisk.level,
    CompletionRate: getStudentCompletionRate(student, assignments),
    AttendanceRate: getAttendanceRate(student),
    LastAdvisingDate: getLastAdvisingDate(student) ?? "",
    Archived: student.archived ? "Yes" : "No",
    ArchiveReason: student.archiveReason ?? "",
    LinkedIn: student.linkedinUrl
  };
}
