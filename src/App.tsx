import {
  AlertTriangle,
  Archive,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Download,
  ExternalLink,
  Eye,
  Mail,
  Plus,
  Save,
  Search,
  UserCircle2,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { buildDashboardMetrics, generateSupervisorSummary, getRecentlyAdvisedStudents, getStudentsNeedingAttention } from "../shared/metrics";
import {
  getAttendanceRate,
  getLastAdvisingDate,
  getStudentCompletionRate
} from "../shared/rules";
import {
  ACTIVITY_LEVELS,
  ADVISING_SESSION_TYPES,
  ARCHIVE_REASONS,
  ASSIGNMENT_STATUSES,
  ATTENDANCE_STATUSES,
  type ActivityLevel,
  type AppState,
  type AssignmentStatus,
  type AssignmentType,
  type AttendanceStatus,
  type Student,
  type StudentAssignmentRecord
} from "../shared/types";
import { downloadFromApi, fetchState, fetchSupervisorSummary, saveState } from "./lib/api";
import { formatDate, uid } from "./lib/utils";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Select } from "./components/ui/select";
import { Textarea } from "./components/ui/textarea";

type View = "dashboard" | "students" | "assignments" | "attendance" | "archive";

type StudentFilters = {
  search: string;
  activityLevel: string;
  riskLevel: string;
  assignmentStatus: string;
  attendanceStatus: string;
  researchInterest: string;
  mentorStatus: string;
};

const INITIAL_FILTERS: StudentFilters = {
  search: "",
  activityLevel: "All",
  riskLevel: "All",
  assignmentStatus: "All",
  attendanceStatus: "All",
  researchInterest: "All",
  mentorStatus: "All"
};

const CHART_COLORS = ["#064E3B", "#047857", "#10B981", "#34D399", "#6EE7B7"];

function getEffectiveActivityLevel(student: Student): ActivityLevel {
  if (student.activity.manualOverride && student.activity.overrideLevel) {
    return student.activity.overrideLevel;
  }
  return student.activity.computedLevel;
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part))
    .join(" ");
}

function emptyStudent(): Student {
  return {
    id: uid("student"),
    name: "",
    email: "",
    alternateEmails: [],
    major: "",
    year: "",
    interest: "",
    linkedinUrl: "",
    notes: "",
    archived: false,
    activity: {
      computedScore: 0,
      computedLevel: "Inactive",
      explanation: "Inactive: little recent engagement. Consider outreach or archive.",
      manualOverride: false
    },
    dropOffRisk: {
      level: "Low",
      reasons: ["Low risk: recent attendance, current assignments, and no major concerns."],
      manuallyMarkedDropped: false
    },
    engagementFlags: {
      openConcernFlag: false
    },
    profile: {
      firstGeneration: "",
      transferStudent: "",
      transferDetails: "",
      previousResearchExperience: "",
      previousResearchDescription: "",
      honorsCollege: "",
      additionalExperiences: "",
      workStudy: "",
      researchInterests: "",
      whyResearch: "",
      fieldOfInterest: "",
      researchEnvironment: "",
      hasPotentialMentor: "",
      mentorNames: "",
      mentorContacted: "",
      cohortPreference: "",
      referralSource: "",
      accessibilityNeeds: "",
      accessibilityNotes: "",
      acknowledgementPathway: "",
      acknowledgementEligibility: ""
    },
    assignments: {},
    attendance: [],
    advisingSessions: []
  };
}

function copyState(state: AppState): AppState {
  return structuredClone(state);
}

function currentDateISO() {
  return new Date().toISOString().slice(0, 10);
}

export function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [filters, setFilters] = useState<StudentFilters>(INITIAL_FILTERS);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState<Student>(emptyStudent());
  const [assignmentForm, setAssignmentForm] = useState({
    name: "",
    description: "",
    dueDate: currentDateISO(),
    category: "Core",
    points: "10",
    rubricNotes: ""
  });
  const [assignmentMatrixFilter, setAssignmentMatrixFilter] = useState({
    assignmentId: "All",
    status: "All",
    sortBy: "name"
  });
  const [attendanceSessionForm, setAttendanceSessionForm] = useState({
    date: currentDateISO(),
    title: "",
    defaultStatus: "Present" as AttendanceStatus,
    notes: ""
  });
  const [attendanceOverrides, setAttendanceOverrides] = useState<Record<string, AttendanceStatus>>({});
  const [supervisorSummary, setSupervisorSummary] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const loaded = await fetchState();
        setState(loaded);
        const summary = await fetchSupervisorSummary();
        setSupervisorSummary(summary);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load app state");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const persistMutation = async (mutator: (draft: AppState) => void) => {
    if (!state) return;
    const next = copyState(state);
    mutator(next);

    setSaving(true);
    setError(null);
    try {
      const saved = await saveState(next);
      setState(saved);
      setSupervisorSummary(generateSupervisorSummary(saved));
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const activeStudents = useMemo(
    () => (state ? state.students.filter((student) => !student.archived) : []),
    [state]
  );

  const archivedStudents = useMemo(
    () => (state ? state.students.filter((student) => student.archived) : []),
    [state]
  );

  const metrics = useMemo(
    () => (state ? buildDashboardMetrics(state) : null),
    [state]
  );

  const filteredStudents = useMemo(() => {
    if (!state) return [];
    return activeStudents.filter((student) => {
      const search = filters.search.toLowerCase().trim();
      const level = getEffectiveActivityLevel(student);
      const latestAttendance = student.attendance
        .slice()
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0]?.status;
      const hasAssignmentStatus =
        filters.assignmentStatus === "All" ||
        Object.values(student.assignments).some((record) => record.status === filters.assignmentStatus);

      const matchesSearch =
        !search ||
        student.name.toLowerCase().includes(search) ||
        student.email.toLowerCase().includes(search);

      const matchesActivity = filters.activityLevel === "All" || level === filters.activityLevel;
      const matchesRisk = filters.riskLevel === "All" || student.dropOffRisk.level === filters.riskLevel;
      const matchesAttendance = filters.attendanceStatus === "All" || latestAttendance === filters.attendanceStatus;
      const matchesInterest =
        filters.researchInterest === "All" ||
        student.profile.researchInterests.toLowerCase().includes(filters.researchInterest.toLowerCase());
      const matchesMentor =
        filters.mentorStatus === "All" ||
        (filters.mentorStatus === "Contacted"
          ? /^yes$/i.test(student.profile.mentorContacted)
          : /^no$/i.test(student.profile.mentorContacted));

      return (
        matchesSearch &&
        matchesActivity &&
        matchesRisk &&
        hasAssignmentStatus &&
        matchesAttendance &&
        matchesInterest &&
        matchesMentor
      );
    });
  }, [activeStudents, filters, state]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId || !state) return null;
    return state.students.find((student) => student.id === selectedStudentId) ?? null;
  }, [selectedStudentId, state]);

  const recentlyAdvised = useMemo(() => getRecentlyAdvisedStudents(activeStudents), [activeStudents]);
  const needingAttention = useMemo(() => getStudentsNeedingAttention(activeStudents), [activeStudents]);

  const handleCreateStudent = async () => {
    if (!newStudent.name.trim() || !newStudent.email.trim()) {
      setError("Name and email are required for new students.");
      return;
    }

    await persistMutation((draft) => {
      draft.students.push({
        ...newStudent,
        profile: {
          ...newStudent.profile,
          researchInterests: newStudent.interest || newStudent.profile.researchInterests
        },
        assignments: Object.fromEntries(
          draft.assignments
            .filter((assignment) => !assignment.archived)
            .map((assignment) => [
              assignment.id,
              {
                assignmentId: assignment.id,
                status: "Not Started",
                feedbackNotes: "",
                internalNotes: "",
                revisionRequested: false
              } satisfies StudentAssignmentRecord
            ])
        )
      });
    });

    setNewStudent(emptyStudent());
    setShowAddStudent(false);
  };

  const handleAddAssignmentForAllStudents = async () => {
    if (!state || !assignmentForm.name.trim()) {
      setError("Assignment name is required.");
      return;
    }

    const newAssignment: AssignmentType = {
      id: uid("assignment"),
      name: assignmentForm.name.trim(),
      description: assignmentForm.description.trim(),
      dueDate: assignmentForm.dueDate,
      category: assignmentForm.category,
      points: Number(assignmentForm.points) || 0,
      rubricNotes: assignmentForm.rubricNotes,
      archived: false
    };

    await persistMutation((draft) => {
      draft.assignments.push(newAssignment);
      draft.students = draft.students.map((student) => {
        if (student.archived) {
          return student;
        }
        return {
          ...student,
          assignments: {
            ...student.assignments,
            [newAssignment.id]: {
              assignmentId: newAssignment.id,
              status: "Not Started",
              feedbackNotes: "",
              internalNotes: "",
              revisionRequested: false
            }
          }
        };
      });
    });

    setAssignmentForm({
      name: "",
      description: "",
      dueDate: currentDateISO(),
      category: "Core",
      points: "10",
      rubricNotes: ""
    });
  };

  const handleCreateAttendanceSession = async () => {
    if (!attendanceSessionForm.title.trim()) {
      setError("Session title is required.");
      return;
    }

    await persistMutation((draft) => {
      const sessionId = uid("session");
      draft.attendanceSessions.push({
        id: sessionId,
        date: attendanceSessionForm.date,
        title: attendanceSessionForm.title.trim(),
        defaultStatus: attendanceSessionForm.defaultStatus,
        notes: attendanceSessionForm.notes
      });

      draft.students = draft.students.map((student) => {
        if (student.archived) {
          return student;
        }

        const status = attendanceOverrides[student.id] ?? attendanceSessionForm.defaultStatus;
        return {
          ...student,
          attendance: [
            ...student.attendance,
            {
              id: uid("attendance"),
              date: attendanceSessionForm.date,
              sessionTitle: attendanceSessionForm.title,
              status,
              notes: attendanceSessionForm.notes
            }
          ]
        };
      });
    });

    setAttendanceOverrides({});
    setAttendanceSessionForm({
      date: currentDateISO(),
      title: "",
      defaultStatus: "Present",
      notes: ""
    });
  };

  const renderDashboard = () => {
    if (!state || !metrics) return null;

    const activityData = Object.entries(metrics.byActivityLevel).map(([name, value]) => ({ name, value }));
    const riskData = Object.entries(metrics.byRiskLevel).map(([name, value]) => ({ name, value }));

    const kpiCards = [
      { label: "Total Active Students", value: metrics.totalActiveStudents, icon: Users },
      { label: "Archived Students", value: metrics.archivedStudents, icon: Archive },
      { label: "Assignment Completion", value: `${metrics.assignmentCompletionRate}%`, icon: ClipboardList },
      { label: "Attendance Rate", value: `${metrics.attendanceRate}%`, icon: CheckCircle2 },
      { label: "No Shows", value: metrics.noShowCount, icon: AlertTriangle },
      { label: "Advising Sessions Logged", value: metrics.advisingSessionsLogged, icon: UserCircle2 }
    ];

    return (
      <div className="space-y-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {kpiCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">{card.label}</p>
                  <p className="mt-1 text-2xl font-heading font-semibold text-deep-green">{card.value}</p>
                </div>
                <card.icon className="h-6 w-6 text-primary-green" />
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h3 className="font-heading text-lg text-deep-green">Activity Level Distribution</h3>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={activityData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={45}>
                    {activityData.map((entry, idx) => (
                      <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-heading text-lg text-deep-green">Drop-off Risk Distribution</h3>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer>
                <BarChart data={riskData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#047857" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h3 className="font-heading text-lg text-deep-green">Students Needing Attention</h3>
              <p className="text-sm text-muted">
                Students flagged by missing assignments, inconsistent attendance, no-shows, or low recent engagement.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {!needingAttention.length && (
                <p className="rounded-xl border border-dashed border-soft-green bg-pale-green/70 p-4 text-sm text-muted">
                  No high-risk students at the moment.
                </p>
              )}
              {needingAttention.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-xl border border-soft-green p-3"
                >
                  <div>
                    <p className="font-medium text-charcoal">{student.name}</p>
                    <p className="text-xs text-muted">{student.dropOffRisk.reasons[0]}</p>
                  </div>
                  <Badge tone={student.dropOffRisk.level}>{student.dropOffRisk.level}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-heading text-lg text-deep-green">Recently Advised Students</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {!recentlyAdvised.length && (
                <p className="rounded-xl border border-dashed border-soft-green bg-pale-green/70 p-4 text-sm text-muted">
                  No advising sessions logged yet. Add a 1:1 card after your next student meeting.
                </p>
              )}
              {recentlyAdvised.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-xl border border-soft-green p-3"
                >
                  <div>
                    <p className="font-medium text-charcoal">{student.name}</p>
                    <p className="text-xs text-muted">Last advised: {formatDate(getLastAdvisingDate(student))}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setView("students");
                      setSelectedStudentId(student.id);
                    }}
                  >
                    Open Profile
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-heading text-lg text-deep-green">Export and Reporting</h3>
              <p className="text-sm text-muted">Generate clean report-ready exports and supervisor narrative.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => downloadFromApi("/api/export/json")}>Export JSON</Button>
              <Button variant="secondary" size="sm" onClick={() => downloadFromApi("/api/export/students.csv")}>Student CSV</Button>
              <Button variant="secondary" size="sm" onClick={() => downloadFromApi("/api/export/assignments.csv")}>Assignment CSV</Button>
              <Button variant="secondary" size="sm" onClick={() => downloadFromApi("/api/export/attendance.csv")}>Attendance CSV</Button>
              <Button variant="secondary" size="sm" onClick={() => downloadFromApi("/api/export/advising.csv")}>Advising CSV</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={supervisorSummary}
              onChange={(event) => setSupervisorSummary(event.target.value)}
              className="min-h-[140px]"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={async () => {
                  const summary = await fetchSupervisorSummary();
                  setSupervisorSummary(summary);
                }}
              >
                Generate Supervisor Summary
              </Button>
              <Button
                onClick={() => {
                  void navigator.clipboard.writeText(supervisorSummary);
                }}
              >
                Copy Summary
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderStudentPokedex = () => {
    if (!state) return null;

    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="grid gap-3 md:grid-cols-4 lg:grid-cols-8">
            <div className="relative md:col-span-2 lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <Input
                className="pl-9"
                placeholder="Search by name or email"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </div>

            <Select
              value={filters.activityLevel}
              onChange={(event) => setFilters((current) => ({ ...current, activityLevel: event.target.value }))}
            >
              <option>All</option>
              {ACTIVITY_LEVELS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>

            <Select
              value={filters.riskLevel}
              onChange={(event) => setFilters((current) => ({ ...current, riskLevel: event.target.value }))}
            >
              <option>All</option>
              <option>Low</option>
              <option>Watch</option>
              <option>High</option>
              <option>Dropped</option>
            </Select>

            <Select
              value={filters.assignmentStatus}
              onChange={(event) =>
                setFilters((current) => ({ ...current, assignmentStatus: event.target.value }))
              }
            >
              <option>All</option>
              {ASSIGNMENT_STATUSES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>

            <Select
              value={filters.attendanceStatus}
              onChange={(event) =>
                setFilters((current) => ({ ...current, attendanceStatus: event.target.value }))
              }
            >
              <option>All</option>
              {ATTENDANCE_STATUSES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>

            <Select
              value={filters.mentorStatus}
              onChange={(event) => setFilters((current) => ({ ...current, mentorStatus: event.target.value }))}
            >
              <option>All</option>
              <option>Contacted</option>
              <option>Not Contacted</option>
            </Select>

            <Button variant="secondary" onClick={() => setFilters(INITIAL_FILTERS)}>
              Reset
            </Button>
          </CardContent>
        </Card>

        {!filteredStudents.length && (
          <Card>
            <CardContent>
              <p className="text-sm text-muted">
                No student records yet. Import a roster or create your first student card.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredStudents.map((student) => {
            const activityLevel = getEffectiveActivityLevel(student);
            return (
              <Card key={student.id} className="overflow-hidden">
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-lg text-deep-green">{student.name}</h3>
                      <p className="text-xs text-muted">{student.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStudentId(student.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-sm text-charcoal">{student.interest || "No research interest summary yet."}</p>

                  <div className="flex flex-wrap gap-2">
                    <Badge tone={activityLevel}>{activityLevel}</Badge>
                    <Badge tone={student.dropOffRisk.level}>{student.dropOffRisk.level}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-pale-green/70 p-3 text-xs">
                    <div>
                      <p className="text-muted">Completion</p>
                      <p className="font-semibold text-deep-green">
                        {getStudentCompletionRate(student, state.assignments)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">Attendance</p>
                      <p className="font-semibold text-deep-green">{getAttendanceRate(student)}%</p>
                    </div>
                    <div>
                      <p className="text-muted">Last Advising</p>
                      <p className="font-semibold text-deep-green">{formatDate(getLastAdvisingDate(student))}</p>
                    </div>
                    <div>
                      <p className="text-muted">LinkedIn</p>
                      <p className="font-semibold text-deep-green">
                        {student.linkedinUrl ? "Linked" : "Missing"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setSelectedStudentId(student.id)}>
                      Open Profile
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => window.open(`mailto:${student.email}`, "_blank")}
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                    {student.linkedinUrl && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(student.linkedinUrl, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                        LinkedIn
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        void persistMutation((draft) => {
                          const target = draft.students.find((item) => item.id === student.id);
                          if (!target) return;
                          target.archived = true;
                          target.archiveDate = new Date().toISOString();
                          target.archiveReason = "No response";
                          target.archiveNotes = "Archived from quick action";
                        });
                      }}
                    >
                      Archive
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAssignmentMatrix = () => {
    if (!state) return null;

    const assignmentOptions = state.assignments.filter((assignment) => !assignment.archived);

    const matrixRows = activeStudents
      .map((student) => {
        const records = Object.values(student.assignments);
        const missingCount = records.filter((record) => record.status === "Missing").length;
        const submittedCount = records.filter((record) => record.status === "Submitted").length;
        const completeCount = records.filter((record) => record.status === "Complete").length;
        const needsRevisionCount = records.filter((record) => record.status === "Needs Revision").length;

        return {
          student,
          missingCount,
          submittedCount,
          completeCount,
          needsRevisionCount
        };
      })
      .filter(({ student }) => {
        if (assignmentMatrixFilter.assignmentId === "All") {
          if (assignmentMatrixFilter.status === "All") return true;
          return Object.values(student.assignments).some(
            (record) => record.status === assignmentMatrixFilter.status
          );
        }

        const record = student.assignments[assignmentMatrixFilter.assignmentId];
        if (!record) return false;
        if (assignmentMatrixFilter.status === "All") return true;
        return record.status === assignmentMatrixFilter.status;
      })
      .sort((a, b) => {
        if (assignmentMatrixFilter.sortBy === "missing") return b.missingCount - a.missingCount;
        if (assignmentMatrixFilter.sortBy === "submitted") return b.submittedCount - a.submittedCount;
        if (assignmentMatrixFilter.sortBy === "complete") return b.completeCount - a.completeCount;
        if (assignmentMatrixFilter.sortBy === "needs-revision") {
          return b.needsRevisionCount - a.needsRevisionCount;
        }
        return a.student.name.localeCompare(b.student.name);
      });

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <h3 className="font-heading text-lg text-deep-green">Create Assignment for All Students</h3>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Assignment name"
              value={assignmentForm.name}
              onChange={(event) =>
                setAssignmentForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <Input
              placeholder="Category"
              value={assignmentForm.category}
              onChange={(event) =>
                setAssignmentForm((current) => ({ ...current, category: event.target.value }))
              }
            />
            <Input
              type="date"
              value={assignmentForm.dueDate}
              onChange={(event) =>
                setAssignmentForm((current) => ({ ...current, dueDate: event.target.value }))
              }
            />
            <Input
              type="number"
              placeholder="Point value"
              value={assignmentForm.points}
              onChange={(event) =>
                setAssignmentForm((current) => ({ ...current, points: event.target.value }))
              }
            />
            <Textarea
              className="md:col-span-2"
              placeholder="Assignment description"
              value={assignmentForm.description}
              onChange={(event) =>
                setAssignmentForm((current) => ({ ...current, description: event.target.value }))
              }
            />
            <Textarea
              className="md:col-span-2"
              placeholder="Rubric notes"
              value={assignmentForm.rubricNotes}
              onChange={(event) =>
                setAssignmentForm((current) => ({ ...current, rubricNotes: event.target.value }))
              }
            />
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button onClick={handleAddAssignmentForAllStudents}>
                Create Assignment for All Students
              </Button>
              <p className="text-sm text-muted self-center">Assignment added to every active student.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="grid gap-3 md:grid-cols-4">
            <Select
              value={assignmentMatrixFilter.assignmentId}
              onChange={(event) =>
                setAssignmentMatrixFilter((current) => ({ ...current, assignmentId: event.target.value }))
              }
            >
              <option value="All">All Assignments</option>
              {assignmentOptions.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.name}
                </option>
              ))}
            </Select>
            <Select
              value={assignmentMatrixFilter.status}
              onChange={(event) =>
                setAssignmentMatrixFilter((current) => ({ ...current, status: event.target.value }))
              }
            >
              <option value="All">All Statuses</option>
              {ASSIGNMENT_STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
            <Select
              value={assignmentMatrixFilter.sortBy}
              onChange={(event) =>
                setAssignmentMatrixFilter((current) => ({ ...current, sortBy: event.target.value }))
              }
            >
              <option value="name">Sort: Name</option>
              <option value="missing">Sort: Missing</option>
              <option value="submitted">Sort: Submitted</option>
              <option value="complete">Sort: Complete</option>
              <option value="needs-revision">Sort: Needs Revision</option>
            </Select>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-2 py-1">Student</th>
                  {assignmentOptions.map((assignment) => (
                    <th key={assignment.id} className="px-2 py-1 min-w-[180px]">
                      <div>{assignment.name}</div>
                      <div className="font-normal text-[11px] normal-case text-muted">
                        Due {formatDate(assignment.dueDate)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixRows.map(({ student }) => (
                  <tr key={student.id} className="rounded-xl bg-pale-green/60">
                    <td className="rounded-l-xl border border-soft-green bg-white px-2 py-3 font-medium">
                      {student.name}
                    </td>
                    {assignmentOptions.map((assignment) => {
                      const record = student.assignments[assignment.id];
                      return (
                        <td key={assignment.id} className="border border-soft-green bg-white px-2 py-2 align-top">
                          {record ? (
                            <div className="space-y-2">
                              <Select
                                value={record.status}
                                onChange={(event) => {
                                  const status = event.target.value as AssignmentStatus;
                                  void persistMutation((draft) => {
                                    const target = draft.students.find((item) => item.id === student.id);
                                    if (!target) return;
                                    const targetRecord = target.assignments[assignment.id];
                                    if (!targetRecord) return;
                                    targetRecord.status = status;
                                    if (status === "Submitted" && !targetRecord.submittedDate) {
                                      targetRecord.submittedDate = new Date().toISOString();
                                    }
                                    if (status === "Complete" && !targetRecord.reviewedDate) {
                                      targetRecord.reviewedDate = new Date().toISOString();
                                    }
                                  });
                                }}
                              >
                                {ASSIGNMENT_STATUSES.map((status) => (
                                  <option key={status}>{status}</option>
                                ))}
                              </Select>
                              <Input
                                type="number"
                                placeholder="Grade"
                                value={record.grade ?? ""}
                                onChange={(event) => {
                                  const grade = event.target.value;
                                  void persistMutation((draft) => {
                                    const target = draft.students.find((item) => item.id === student.id);
                                    if (!target) return;
                                    const targetRecord = target.assignments[assignment.id];
                                    if (!targetRecord) return;
                                    targetRecord.grade = grade ? Number(grade) : undefined;
                                  });
                                }}
                              />
                              <Textarea
                                placeholder="Feedback notes"
                                className="min-h-[76px]"
                                value={record.feedbackNotes}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  void persistMutation((draft) => {
                                    const target = draft.students.find((item) => item.id === student.id);
                                    if (!target) return;
                                    const targetRecord = target.assignments[assignment.id];
                                    if (!targetRecord) return;
                                    targetRecord.feedbackNotes = value;
                                  });
                                }}
                              />
                            </div>
                          ) : (
                            <p className="text-xs text-muted">No record</p>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAttendanceView = () => {
    if (!state) return null;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <h3 className="font-heading text-lg text-deep-green">Create Attendance Session</h3>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input
              type="date"
              value={attendanceSessionForm.date}
              onChange={(event) =>
                setAttendanceSessionForm((current) => ({ ...current, date: event.target.value }))
              }
            />
            <Input
              placeholder="Session title"
              value={attendanceSessionForm.title}
              onChange={(event) =>
                setAttendanceSessionForm((current) => ({ ...current, title: event.target.value }))
              }
            />
            <Select
              value={attendanceSessionForm.defaultStatus}
              onChange={(event) =>
                setAttendanceSessionForm((current) => ({
                  ...current,
                  defaultStatus: event.target.value as AttendanceStatus
                }))
              }
            >
              {ATTENDANCE_STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
            <Textarea
              placeholder="Session notes"
              value={attendanceSessionForm.notes}
              onChange={(event) =>
                setAttendanceSessionForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
            <div className="md:col-span-2 rounded-xl border border-soft-green p-3">
              <p className="mb-2 text-sm font-medium text-deep-green">Per-student status overrides</p>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {activeStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-xs text-charcoal">{student.name}</span>
                    <Select
                      className="h-8 w-[120px] text-xs"
                      value={attendanceOverrides[student.id] ?? attendanceSessionForm.defaultStatus}
                      onChange={(event) =>
                        setAttendanceOverrides((current) => ({
                          ...current,
                          [student.id]: event.target.value as AttendanceStatus
                        }))
                      }
                    >
                      {ATTENDANCE_STATUSES.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <Button onClick={handleCreateAttendanceSession}>Create Attendance Session</Button>
              <p className="text-sm text-muted">No attendance records yet. Log a session to begin tracking engagement.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-heading text-lg text-deep-green">Recent Attendance Timeline</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeStudents.flatMap((student) =>
              student.attendance
                .slice()
                .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
                .slice(0, 2)
                .map((entry) => ({ student, entry }))
            ).length === 0 && <p className="text-sm text-muted">No attendance records yet.</p>}

            {activeStudents
              .flatMap((student) =>
                student.attendance
                  .slice()
                  .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
                  .slice(0, 2)
                  .map((entry) => ({ student, entry }))
              )
              .sort((a, b) => Date.parse(b.entry.date) - Date.parse(a.entry.date))
              .slice(0, 20)
              .map(({ student, entry }) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-xl border border-soft-green px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-charcoal">{student.name}</p>
                    <p className="text-xs text-muted">
                      {entry.sessionTitle} • {formatDate(entry.date)}
                    </p>
                  </div>
                  <Badge tone={entry.status}>{entry.status}</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderArchiveView = () => {
    if (!state) return null;
    return (
      <div className="space-y-4">
        {!archivedStudents.length && (
          <Card>
            <CardContent>
              <p className="text-sm text-muted">
                No archived students. Students you archive will appear here for future reference.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {archivedStudents.map((student) => (
            <Card key={student.id}>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-lg text-deep-green">{student.name}</h3>
                    <p className="text-xs text-muted">{student.email}</p>
                  </div>
                  <Badge tone="Dropped">Archived</Badge>
                </div>
                <div className="text-sm text-charcoal">
                  <p>Archive reason: {student.archiveReason || "-"}</p>
                  <p>Archive date: {formatDate(student.archiveDate)}</p>
                  <p>Final risk: {student.dropOffRisk.level}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    Open Profile
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      void persistMutation((draft) => {
                        const target = draft.students.find((item) => item.id === student.id);
                        if (!target) return;
                        target.archived = false;
                        target.archiveDate = undefined;
                        target.archiveReason = undefined;
                        target.archiveNotes = undefined;
                      });
                    }}
                  >
                    Restore Student
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderSelectedStudentPanel = () => {
    if (!selectedStudent || !state) return null;

    const activityLevel = getEffectiveActivityLevel(selectedStudent);

    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
        <div className="h-full w-full max-w-3xl overflow-y-auto bg-warm-off-white p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl text-deep-green">Student Profile</h2>
              <p className="text-sm text-muted">{selectedStudent.name}</p>
            </div>
            <Button variant="secondary" onClick={() => setSelectedStudentId(null)}>
              Close
            </Button>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="font-heading text-lg text-deep-green">Header</h3>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <Input
                  value={selectedStudent.name}
                  onChange={(event) => {
                    const value = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.name = value;
                    });
                  }}
                />
                <Input
                  value={selectedStudent.email}
                  onChange={(event) => {
                    const value = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.email = value;
                    });
                  }}
                />
                <Input
                  placeholder="Major"
                  value={selectedStudent.major}
                  onChange={(event) => {
                    const value = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.major = value;
                    });
                  }}
                />
                <Input
                  placeholder="Year"
                  value={selectedStudent.year}
                  onChange={(event) => {
                    const value = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.year = value;
                    });
                  }}
                />
                <Input
                  placeholder="LinkedIn URL"
                  value={selectedStudent.linkedinUrl}
                  onChange={(event) => {
                    const value = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.linkedinUrl = value;
                    });
                  }}
                  className="md:col-span-2"
                />
                <Textarea
                  placeholder="Interest summary"
                  className="md:col-span-2"
                  value={selectedStudent.interest}
                  onChange={(event) => {
                    const value = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.interest = value;
                    });
                  }}
                />
                <div className="md:col-span-2 flex flex-wrap items-center gap-2 rounded-xl bg-pale-green/70 p-3 text-sm">
                  <Badge tone={activityLevel}>{activityLevel}</Badge>
                  <Badge tone={selectedStudent.dropOffRisk.level}>{selectedStudent.dropOffRisk.level}</Badge>
                  <span className="text-muted">{selectedStudent.activity.explanation}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-heading text-lg text-deep-green">Manual Activity Override</h3>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-charcoal">
                  <input
                    type="checkbox"
                    checked={selectedStudent.activity.manualOverride}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      void persistMutation((draft) => {
                        const target = draft.students.find((item) => item.id === selectedStudent.id);
                        if (!target) return;
                        target.activity.manualOverride = checked;
                        if (!checked) {
                          target.activity.overrideLevel = undefined;
                          target.activity.overrideReason = undefined;
                        }
                      });
                    }}
                  />
                  Manual Override Active
                </label>

                <label className="flex items-center gap-2 text-sm text-charcoal">
                  <input
                    type="checkbox"
                    checked={selectedStudent.engagementFlags.openConcernFlag}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      void persistMutation((draft) => {
                        const target = draft.students.find((item) => item.id === selectedStudent.id);
                        if (!target) return;
                        target.engagementFlags.openConcernFlag = checked;
                      });
                    }}
                  />
                  Open Concern Flag
                </label>

                <Select
                  disabled={!selectedStudent.activity.manualOverride}
                  value={selectedStudent.activity.overrideLevel ?? "Moderate"}
                  onChange={(event) => {
                    const level = event.target.value as ActivityLevel;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.activity.overrideLevel = level;
                    });
                  }}
                >
                  {ACTIVITY_LEVELS.map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </Select>

                <Input
                  placeholder="Override reason"
                  disabled={!selectedStudent.activity.manualOverride}
                  value={selectedStudent.activity.overrideReason ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.activity.overrideReason = value;
                    });
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-heading text-lg text-deep-green">Research Profile</h3>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <Textarea
                  placeholder="Research interests"
                  value={selectedStudent.profile.researchInterests}
                  onChange={(event) => {
                    const value = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.profile.researchInterests = value;
                    });
                  }}
                />
                <Textarea
                  placeholder="Field of interest"
                  value={selectedStudent.profile.fieldOfInterest}
                  onChange={(event) => {
                    const value = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.profile.fieldOfInterest = value;
                    });
                  }}
                />
                <Textarea
                  placeholder="Preferred research environment"
                  value={selectedStudent.profile.researchEnvironment}
                  onChange={(event) => {
                    const value = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.profile.researchEnvironment = value;
                    });
                  }}
                />
                <Textarea
                  placeholder="Why research"
                  value={selectedStudent.profile.whyResearch}
                  onChange={(event) => {
                    const value = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.profile.whyResearch = value;
                    });
                  }}
                />
                <Input
                  placeholder="Potential mentor interest"
                  value={selectedStudent.profile.hasPotentialMentor}
                  onChange={(event) => {
                    const value = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.profile.hasPotentialMentor = value;
                    });
                  }}
                />
                <Input
                  placeholder="Mentor names"
                  value={selectedStudent.profile.mentorNames}
                  onChange={(event) => {
                    const value = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.profile.mentorNames = value;
                    });
                  }}
                />
                <Input
                  placeholder="Mentor contacted status"
                  value={selectedStudent.profile.mentorContacted}
                  onChange={(event) => {
                    const value = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.profile.mentorContacted = value;
                    });
                  }}
                />
                <Input
                  placeholder="Cohort preference"
                  value={selectedStudent.profile.cohortPreference}
                  onChange={(event) => {
                    const value = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.profile.cohortPreference = value;
                    });
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-heading text-lg text-deep-green">Assignment Progress</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {!state.assignments.length && (
                  <p className="text-sm text-muted">
                    No assignments yet. Create one assignment type and it will appear for every active student.
                  </p>
                )}

                {state.assignments
                  .filter((assignment) => !assignment.archived)
                  .map((assignment) => {
                    const record = selectedStudent.assignments[assignment.id];
                    if (!record) return null;
                    return (
                      <div key={assignment.id} className="rounded-xl border border-soft-green p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-charcoal">{assignment.name}</p>
                            <p className="text-xs text-muted">Due {formatDate(assignment.dueDate)}</p>
                          </div>
                          <Badge tone={record.status}>{record.status}</Badge>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2">
                          <Select
                            value={record.status}
                            onChange={(event) => {
                              const status = event.target.value as AssignmentStatus;
                              void persistMutation((draft) => {
                                const target = draft.students.find((item) => item.id === selectedStudent.id);
                                if (!target) return;
                                const targetRecord = target.assignments[assignment.id];
                                if (!targetRecord) return;
                                targetRecord.status = status;
                                if (status === "Submitted" && !targetRecord.submittedDate) {
                                  targetRecord.submittedDate = new Date().toISOString();
                                }
                              });
                            }}
                          >
                            {ASSIGNMENT_STATUSES.map((status) => (
                              <option key={status}>{status}</option>
                            ))}
                          </Select>

                          <Input
                            type="number"
                            placeholder="Grade"
                            value={record.grade ?? ""}
                            onChange={(event) => {
                              const grade = event.target.value;
                              void persistMutation((draft) => {
                                const target = draft.students.find((item) => item.id === selectedStudent.id);
                                if (!target) return;
                                const targetRecord = target.assignments[assignment.id];
                                if (!targetRecord) return;
                                targetRecord.grade = grade ? Number(grade) : undefined;
                              });
                            }}
                          />

                          <Textarea
                            placeholder="Feedback notes"
                            value={record.feedbackNotes}
                            onChange={(event) => {
                              const value = event.target.value;
                              void persistMutation((draft) => {
                                const target = draft.students.find((item) => item.id === selectedStudent.id);
                                if (!target) return;
                                target.assignments[assignment.id].feedbackNotes = value;
                              });
                            }}
                          />

                          <Textarea
                            placeholder="Internal mentor notes"
                            value={record.internalNotes}
                            onChange={(event) => {
                              const value = event.target.value;
                              void persistMutation((draft) => {
                                const target = draft.students.find((item) => item.id === selectedStudent.id);
                                if (!target) return;
                                target.assignments[assignment.id].internalNotes = value;
                              });
                            }}
                          />

                          <label className="md:col-span-2 flex items-center gap-2 text-sm text-charcoal">
                            <input
                              type="checkbox"
                              checked={record.revisionRequested}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                void persistMutation((draft) => {
                                  const target = draft.students.find((item) => item.id === selectedStudent.id);
                                  if (!target) return;
                                  target.assignments[assignment.id].revisionRequested = checked;
                                });
                              }}
                            />
                            Revision requested
                          </label>
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <h3 className="font-heading text-lg text-deep-green">1:1 Advising History</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.advisingSessions.push({
                        id: uid("advising"),
                        date: currentDateISO(),
                        sessionType: "General advising",
                        topic: "",
                        goalsDiscussed: "",
                        mentorNotes: "",
                        actionItems: "",
                        followUpCompleted: false
                      });
                    });
                  }}
                >
                  Add Advising Session
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {!selectedStudent.advisingSessions.length && (
                  <p className="text-sm text-muted">
                    No advising sessions logged yet. Add a 1:1 card after your next student meeting.
                  </p>
                )}

                {selectedStudent.advisingSessions
                  .slice()
                  .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
                  .map((session) => (
                    <div key={session.id} className="rounded-xl border border-soft-green p-3">
                      <div className="grid gap-2 md:grid-cols-2">
                        <Input
                          type="date"
                          value={session.date}
                          onChange={(event) => {
                            const value = event.target.value;
                            void persistMutation((draft) => {
                              const target = draft.students.find((item) => item.id === selectedStudent.id);
                              if (!target) return;
                              const targetSession = target.advisingSessions.find((item) => item.id === session.id);
                              if (!targetSession) return;
                              targetSession.date = value;
                            });
                          }}
                        />
                        <Select
                          value={session.sessionType}
                          onChange={(event) => {
                            const value = event.target.value;
                            void persistMutation((draft) => {
                              const target = draft.students.find((item) => item.id === selectedStudent.id);
                              if (!target) return;
                              const targetSession = target.advisingSessions.find((item) => item.id === session.id);
                              if (!targetSession) return;
                              targetSession.sessionType = value;
                            });
                          }}
                        >
                          {ADVISING_SESSION_TYPES.map((type) => (
                            <option key={type}>{type}</option>
                          ))}
                        </Select>
                        <Input
                          placeholder="Topic"
                          value={session.topic}
                          onChange={(event) => {
                            const value = event.target.value;
                            void persistMutation((draft) => {
                              const target = draft.students.find((item) => item.id === selectedStudent.id);
                              if (!target) return;
                              const targetSession = target.advisingSessions.find((item) => item.id === session.id);
                              if (!targetSession) return;
                              targetSession.topic = value;
                            });
                          }}
                          className="md:col-span-2"
                        />
                        <Textarea
                          placeholder="Student goals discussed"
                          value={session.goalsDiscussed}
                          onChange={(event) => {
                            const value = event.target.value;
                            void persistMutation((draft) => {
                              const target = draft.students.find((item) => item.id === selectedStudent.id);
                              if (!target) return;
                              const targetSession = target.advisingSessions.find((item) => item.id === session.id);
                              if (!targetSession) return;
                              targetSession.goalsDiscussed = value;
                            });
                          }}
                        />
                        <Textarea
                          placeholder="Mentor notes"
                          value={session.mentorNotes}
                          onChange={(event) => {
                            const value = event.target.value;
                            void persistMutation((draft) => {
                              const target = draft.students.find((item) => item.id === selectedStudent.id);
                              if (!target) return;
                              const targetSession = target.advisingSessions.find((item) => item.id === session.id);
                              if (!targetSession) return;
                              targetSession.mentorNotes = value;
                            });
                          }}
                        />
                        <Textarea
                          placeholder="Action items"
                          value={session.actionItems}
                          onChange={(event) => {
                            const value = event.target.value;
                            void persistMutation((draft) => {
                              const target = draft.students.find((item) => item.id === selectedStudent.id);
                              if (!target) return;
                              const targetSession = target.advisingSessions.find((item) => item.id === session.id);
                              if (!targetSession) return;
                              targetSession.actionItems = value;
                            });
                          }}
                        />
                        <Input
                          type="date"
                          value={session.followUpDate ?? ""}
                          onChange={(event) => {
                            const value = event.target.value;
                            void persistMutation((draft) => {
                              const target = draft.students.find((item) => item.id === selectedStudent.id);
                              if (!target) return;
                              const targetSession = target.advisingSessions.find((item) => item.id === session.id);
                              if (!targetSession) return;
                              targetSession.followUpDate = value || undefined;
                            });
                          }}
                        />
                        <label className="flex items-center gap-2 text-sm text-charcoal">
                          <input
                            type="checkbox"
                            checked={session.followUpCompleted}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              void persistMutation((draft) => {
                                const target = draft.students.find((item) => item.id === selectedStudent.id);
                                if (!target) return;
                                const targetSession = target.advisingSessions.find((item) => item.id === session.id);
                                if (!targetSession) return;
                                targetSession.followUpCompleted = checked;
                              });
                            }}
                          />
                          Follow-up completed
                        </label>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-heading text-lg text-deep-green">Attendance and Engagement</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    type="date"
                    defaultValue={currentDateISO()}
                    id="new-attendance-date"
                  />
                  <Input
                    placeholder="Session title"
                    id="new-attendance-title"
                  />
                  <Select id="new-attendance-status" defaultValue="Present">
                    {ATTENDANCE_STATUSES.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </Select>
                  <Input placeholder="Notes" id="new-attendance-notes" />
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const dateValue = (document.getElementById("new-attendance-date") as HTMLInputElement | null)
                      ?.value;
                    const titleValue = (
                      document.getElementById("new-attendance-title") as HTMLInputElement | null
                    )?.value;
                    const statusValue = (
                      document.getElementById("new-attendance-status") as HTMLSelectElement | null
                    )?.value as AttendanceStatus;
                    const notesValue = (
                      document.getElementById("new-attendance-notes") as HTMLInputElement | null
                    )?.value;

                    if (!titleValue) {
                      setError("Attendance session title is required.");
                      return;
                    }

                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.attendance.push({
                        id: uid("attendance"),
                        date: dateValue || currentDateISO(),
                        sessionTitle: titleValue,
                        status: statusValue || "Present",
                        notes: notesValue || ""
                      });
                    });
                  }}
                >
                  Log Attendance
                </Button>

                {!selectedStudent.attendance.length && (
                  <p className="text-sm text-muted">No attendance records yet. Log a session to begin tracking engagement.</p>
                )}

                {selectedStudent.attendance
                  .slice()
                  .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
                  .map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between rounded-xl border border-soft-green px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-charcoal">{record.sessionTitle}</p>
                        <p className="text-xs text-muted">{formatDate(record.date)}</p>
                      </div>
                      <Badge tone={record.status}>{record.status}</Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-heading text-lg text-deep-green">Private Mentor Notes</h3>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={selectedStudent.notes}
                  onChange={(event) => {
                    const value = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.notes = value;
                    });
                  }}
                />
              </CardContent>
            </Card>

            <Card className="border-risk-red/25">
              <CardHeader>
                <h3 className="font-heading text-lg text-risk-red">Archive Controls</h3>
                <p className="text-sm text-muted">
                  Archiving hides this student from active tracking but keeps their record available for reporting.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={selectedStudent.archiveReason ?? "Stopped attending"}
                  onChange={(event) => {
                    const reason = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.archiveReason = reason;
                    });
                  }}
                >
                  {ARCHIVE_REASONS.map((reason) => (
                    <option key={reason}>{reason}</option>
                  ))}
                </Select>
                <Textarea
                  placeholder="Final notes before archiving"
                  value={selectedStudent.archiveNotes ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    void persistMutation((draft) => {
                      const target = draft.students.find((item) => item.id === selectedStudent.id);
                      if (!target) return;
                      target.archiveNotes = value;
                    });
                  }}
                />
                <div className="flex gap-2">
                  {!selectedStudent.archived ? (
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (
                          !window.confirm(
                            "Archive this student? Their record will move to the archive and can be restored later."
                          )
                        ) {
                          return;
                        }
                        void persistMutation((draft) => {
                          const target = draft.students.find((item) => item.id === selectedStudent.id);
                          if (!target) return;
                          target.archived = true;
                          target.archiveDate = new Date().toISOString();
                          target.archiveReason = target.archiveReason || "Stopped attending";
                        });
                      }}
                    >
                      Archive Student
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        if (!window.confirm("Restore this student to active tracking?")) {
                          return;
                        }
                        void persistMutation((draft) => {
                          const target = draft.students.find((item) => item.id === selectedStudent.id);
                          if (!target) return;
                          target.archived = false;
                          target.archiveDate = undefined;
                          target.archiveReason = undefined;
                          target.archiveNotes = undefined;
                        });
                      }}
                    >
                      Restore Student
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted">Loading Pathway Command Center...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-3xl border border-soft-green bg-gradient-to-r from-deep-green to-primary-green p-6 text-white shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl font-semibold">Pathway Command Center</h1>
              <p className="mt-2 max-w-3xl text-sm text-emerald-50/95">
                Track student progress, advising engagement, attendance, assignments, and drop-off risk from one clean workspace.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => setShowAddStudent(true)}>
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
              <Button variant="secondary" onClick={() => setView("assignments")}>
                <ClipboardList className="h-4 w-4" />
                Create Assignment for All Students
              </Button>
              <Button variant="secondary" onClick={() => setView("attendance")}>Log Attendance</Button>
              <Button variant="secondary" onClick={() => setView("dashboard")}>
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </header>

        <nav className="grid gap-2 rounded-2xl border border-soft-green bg-white p-2 shadow-soft sm:grid-cols-5">
          {[
            { key: "dashboard", label: "Dashboard", icon: BarChart3 },
            { key: "students", label: "Student Pokedex", icon: Users },
            { key: "assignments", label: "Assignment Matrix", icon: ClipboardList },
            { key: "attendance", label: "Attendance", icon: CheckCircle2 },
            { key: "archive", label: "Archive", icon: Archive }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setView(tab.key as View)}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                view === tab.key
                  ? "bg-primary-green text-white"
                  : "bg-pale-green/70 text-deep-green hover:bg-soft-green"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {error && (
          <Card className="border-risk-red/40">
            <CardContent>
              <p className="text-sm text-risk-red">{error}</p>
            </CardContent>
          </Card>
        )}

        {saving && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Save className="h-3 w-3 animate-pulse" />
            Saving changes to SQLite database...
          </div>
        )}

        <main className="pb-10">
          {view === "dashboard" && renderDashboard()}
          {view === "students" && renderStudentPokedex()}
          {view === "assignments" && renderAssignmentMatrix()}
          {view === "attendance" && renderAttendanceView()}
          {view === "archive" && renderArchiveView()}
        </main>
      </div>

      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <h3 className="font-heading text-lg text-deep-green">Add Student</h3>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Full name"
                value={newStudent.name}
                onChange={(event) =>
                  setNewStudent((current) => ({ ...current, name: toTitleCase(event.target.value) }))
                }
              />
              <Input
                placeholder="MSU Email"
                value={newStudent.email}
                onChange={(event) =>
                  setNewStudent((current) => ({ ...current, email: event.target.value.trim() }))
                }
              />
              <Input
                placeholder="Major"
                value={newStudent.major}
                onChange={(event) =>
                  setNewStudent((current) => ({ ...current, major: event.target.value }))
                }
              />
              <Input
                placeholder="Year"
                value={newStudent.year}
                onChange={(event) =>
                  setNewStudent((current) => ({ ...current, year: event.target.value }))
                }
              />
              <Input
                placeholder="LinkedIn URL"
                value={newStudent.linkedinUrl}
                onChange={(event) =>
                  setNewStudent((current) => ({ ...current, linkedinUrl: event.target.value }))
                }
                className="md:col-span-2"
              />
              <Textarea
                placeholder="Interest"
                value={newStudent.interest}
                onChange={(event) =>
                  setNewStudent((current) => ({ ...current, interest: event.target.value }))
                }
                className="md:col-span-2"
              />
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowAddStudent(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateStudent}>Add Student</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {renderSelectedStudentPanel()}
    </div>
  );
}
