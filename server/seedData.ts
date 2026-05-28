import { recalculateAllStudents } from "../shared/rules";
import type { ActivityState, AppState, Student } from "../shared/types";

const SANITIZED_SEED_ROWS = [
  {
    firstName: "Alex",
    lastName: "Morgan",
    email: "alex.morgan@msu.edu",
    firstGeneration: "Yes",
    transferStudent: "No",
    previousResearchExperience: "No",
    honorsCollege: "No",
    workStudy: "No",
    researchInterests: "Artificial Intelligence, Robotics",
    whyResearch:
      "Interested in learning how research teams translate concepts into real-world engineering outcomes.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment: "Dry Lab (Computational, Physics, Applied Mathematics)",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "No",
    cohortPreference: "STEM",
    referralSource: "Program email",
    accessibilityNeeds: "No",
    accessibilityNotes: ""
  },
  {
    firstName: "Jordan",
    lastName: "Lee",
    email: "jordan.lee@msu.edu",
    firstGeneration: "No",
    transferStudent: "No",
    previousResearchExperience: "No",
    honorsCollege: "Yes",
    workStudy: "Yes",
    researchInterests: "Semiconductors, Renewable Energy",
    whyResearch: "Wants practical exposure to applied research and faculty collaboration.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment: "Wet Lab (Chemical, Biological matter),Dry Lab (Computational, Physics, Applied Mathematics)",
    hasPotentialMentor: "Yes",
    mentorNames: "Sample Mentor",
    mentorContacted: "No",
    cohortPreference: "STEM",
    referralSource: "Advisor",
    accessibilityNeeds: "No",
    accessibilityNotes: ""
  },
  {
    firstName: "Casey",
    lastName: "Rivera",
    email: "casey.rivera@msu.edu",
    firstGeneration: "No",
    transferStudent: "Yes",
    previousResearchExperience: "No",
    honorsCollege: "No",
    workStudy: "No",
    researchInterests: "Aerospace Systems, Controls",
    whyResearch: "Exploring research pathways before graduate school applications.",
    fieldOfInterest: "STEM (Science, Technology, Engineering, Mathematics)",
    researchEnvironment: "Dry Lab (Computational, Physics, Applied Mathematics)",
    hasPotentialMentor: "No",
    mentorNames: "",
    mentorContacted: "No",
    cohortPreference: "General (No preference)",
    referralSource: "Campus event",
    accessibilityNeeds: "No",
    accessibilityNotes: ""
  }
];

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function emptyActivityState(): ActivityState {
  return {
    computedScore: 0,
    computedLevel: "Inactive",
    explanation: "Inactive: little recent engagement. Consider outreach or archive.",
    manualOverride: false
  };
}

function buildSeedStudents(): Student[] {
  return SANITIZED_SEED_ROWS.map((row, index) => ({
    id: `${toSlug(row.firstName)}-${toSlug(row.lastName)}-${index + 1}`,
    name: `${row.firstName} ${row.lastName}`,
    email: row.email,
    alternateEmails: [],
    major: "",
    year: "",
    interest: row.researchInterests,
    linkedinUrl: "",
    notes: "",
    archived: false,
    engagementFlags: {
      openConcernFlag: false
    },
    activity: emptyActivityState(),
    dropOffRisk: {
      level: "Low",
      reasons: ["Low risk: recent attendance, current assignments, and no major concerns."],
      manuallyMarkedDropped: false
    },
    profile: {
      firstGeneration: row.firstGeneration,
      transferStudent: row.transferStudent,
      transferDetails: "",
      previousResearchExperience: row.previousResearchExperience,
      previousResearchDescription: "",
      honorsCollege: row.honorsCollege,
      additionalExperiences: "",
      workStudy: row.workStudy,
      researchInterests: row.researchInterests,
      whyResearch: row.whyResearch,
      fieldOfInterest: row.fieldOfInterest,
      researchEnvironment: row.researchEnvironment,
      hasPotentialMentor: row.hasPotentialMentor,
      mentorNames: row.mentorNames,
      mentorContacted: row.mentorContacted,
      cohortPreference: row.cohortPreference,
      referralSource: row.referralSource,
      accessibilityNeeds: row.accessibilityNeeds,
      accessibilityNotes: row.accessibilityNotes,
      acknowledgementPathway: "",
      acknowledgementEligibility: ""
    },
    assignments: {},
    attendance: [],
    advisingSessions: []
  }));
}

export function createSeedState(): AppState {
  const students = recalculateAllStudents(buildSeedStudents(), []);
  return {
    students,
    assignments: [],
    attendanceSessions: [],
    updatedAt: new Date().toISOString()
  };
}
