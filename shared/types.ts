export const ASSIGNMENT_STATUSES = [
  "Not Started",
  "In Progress",
  "Submitted",
  "Needs Revision",
  "Complete",
  "Excused",
  "Missing"
] as const;

export const ATTENDANCE_STATUSES = [
  "Present",
  "Late",
  "Excused",
  "Absent",
  "No Show"
] as const;

export const ACTIVITY_LEVELS = ["Excellent", "High", "Moderate", "Low", "Inactive"] as const;

export const RISK_LEVELS = ["Low", "Watch", "High", "Dropped"] as const;

export const ADVISING_SESSION_TYPES = [
  "General advising",
  "Research interest exploration",
  "Faculty outreach review",
  "Email draft review",
  "Lab search strategy",
  "Resume or profile review",
  "Follow-up check-in",
  "Concern or intervention"
] as const;

export const ARCHIVE_REASONS = [
  "Stopped attending",
  "No response",
  "Graduated",
  "Withdrew from program",
  "No longer eligible",
  "Completed pathway",
  "Other"
] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];
export type AdvisingSessionType = (typeof ADVISING_SESSION_TYPES)[number];
export type ArchiveReason = (typeof ARCHIVE_REASONS)[number];

export type ActivityState = {
  computedScore: number;
  computedLevel: ActivityLevel;
  explanation: string;
  manualOverride: boolean;
  overrideLevel?: ActivityLevel;
  overrideReason?: string;
};

export type RiskState = {
  level: RiskLevel;
  reasons: string[];
  manuallyMarkedDropped?: boolean;
};

export type StudentProfile = {
  firstGeneration: string;
  transferStudent: string;
  transferDetails: string;
  previousResearchExperience: string;
  previousResearchDescription: string;
  honorsCollege: string;
  additionalExperiences: string;
  workStudy: string;
  researchInterests: string;
  whyResearch: string;
  fieldOfInterest: string;
  researchEnvironment: string;
  hasPotentialMentor: string;
  mentorNames: string;
  mentorContacted: string;
  cohortPreference: string;
  referralSource: string;
  accessibilityNeeds: string;
  accessibilityNotes: string;
  acknowledgementPathway: string;
  acknowledgementEligibility: string;
};

export type StudentAssignmentRecord = {
  assignmentId: string;
  status: AssignmentStatus;
  grade?: number;
  submittedDate?: string;
  reviewedDate?: string;
  feedbackNotes: string;
  internalNotes: string;
  revisionRequested: boolean;
};

export type AttendanceRecord = {
  id: string;
  date: string;
  sessionTitle: string;
  status: AttendanceStatus;
  notes: string;
};

export type AdvisingSession = {
  id: string;
  date: string;
  sessionType: string;
  topic: string;
  goalsDiscussed: string;
  mentorNotes: string;
  actionItems: string;
  followUpDate?: string;
  followUpCompleted: boolean;
  relatedAssignmentId?: string;
};

export type AssignmentType = {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  category: string;
  points: number;
  rubricNotes: string;
  archived: boolean;
};

export type Student = {
  id: string;
  name: string;
  email: string;
  alternateEmails: string[];
  major: string;
  year: string;
  interest: string;
  linkedinUrl: string;
  notes: string;
  archived: boolean;
  archiveDate?: string;
  archiveReason?: string;
  archiveNotes?: string;
  engagementFlags: {
    openConcernFlag: boolean;
  };
  activity: ActivityState;
  dropOffRisk: RiskState;
  profile: StudentProfile;
  assignments: Record<string, StudentAssignmentRecord>;
  attendance: AttendanceRecord[];
  advisingSessions: AdvisingSession[];
};

export type AttendanceSession = {
  id: string;
  date: string;
  title: string;
  defaultStatus: AttendanceStatus;
  notes: string;
};

export type AppState = {
  students: Student[];
  assignments: AssignmentType[];
  attendanceSessions: AttendanceSession[];
  updatedAt: string;
};
