import { z } from "zod";
export const CURRENT_SCHEMA_VERSION = 1;
const id = z.string();
export const Segment = z.object({
  id,
  at: z.string(),
  speaker: z.string(),
  text: z.string(),
});
export const Response = z.object({
  id,
  question: z.string(),
  intent: z.string(),
  short: z.string(),
  star: z.string(),
  details: z.string(),
  talkingPoints: z.array(z.string()),
  followUps: z.array(z.string()),
  at: z.string(),
  pinned: z.boolean().default(false),
});
export const Session = z.object({
  id,
  type: z.enum(["live", "interview", "meeting"]),
  title: z.string(),
  company: z.string(),
  role: z.string(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  status: z.enum(["active", "paused", "completed"]),
  durationSeconds: z.number(),
  transcript: z.array(Segment),
  questions: z.array(z.string()),
  responses: z.array(Response),
  notes: z.array(z.string()),
  summary: z.string(),
  feedbackId: z.string().optional(),
  participants: z.string().optional(),
  context: z.string().optional(),
  decisions: z.array(z.string()).default([]),
  actions: z.array(z.string()).default([]),
});
export const Memory = z.object({
  id,
  title: z.string(),
  content: z.string(),
  type: z.enum([
    "Profile",
    "Project",
    "Story",
    "Skill",
    "Achievement",
    "Company",
    "Interview Answer",
    "Custom",
  ]),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  pinned: z.boolean(),
});
export const Prep = z.object({
  id,
  company: z.string(),
  role: z.string(),
  jobDescription: z.string(),
  companyContext: z.string(),
  interviewType: z.string(),
  projects: z.string(),
  createdAt: z.string(),
  questions: z.array(z.string()),
  notes: z.array(z.string()),
});
export const User = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  goal: z.string(),
  resume: z.string(),
  companyContext: z.string(),
  projects: z.string(),
  jobDescription: z.string().optional(),
  interviewType: z.string().optional(),
});
export const Settings = z.object({
  reducedMotion: z.boolean(),
  timestamps: z.boolean(),
  autoscroll: z.boolean(),
  compact: z.boolean(),
  sound: z.boolean(),
  responseMode: z.enum(["short", "star", "details"]),
});
export const State = z.object({
  schemaVersion: z.literal(1),
  user: User.nullable(),
  onboarding: z.boolean(),
  settings: Settings,
  sessions: z.array(Session),
  memories: z.array(Memory),
  prep: z.array(Prep),
  activeSessionId: z.string().nullable(),
});
export type AppState = z.infer<typeof State>;
export type SessionType = z.infer<typeof Session>;
export type MemoryType = z.infer<typeof Memory>;
export type PrepType = z.infer<typeof Prep>;
export type ResponseType = z.infer<typeof Response>;
export const emptyState: AppState = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  user: null,
  onboarding: false,
  settings: {
    reducedMotion: false,
    timestamps: true,
    autoscroll: true,
    compact: false,
    sound: false,
    responseMode: "short",
  },
  sessions: [],
  memories: [],
  prep: [],
  activeSessionId: null,
};
export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const now = () => new Date().toISOString();
export const sampleState = (): AppState => {
  const timestamp = now();
  const session: SessionType = {
    id: uid(),
    type: "interview",
    title: "Sample: Northstar interview practice",
    company: "Northstar Labs",
    role: "Machine Learning Engineer",
    startedAt: timestamp,
    endedAt: timestamp,
    status: "completed",
    durationSeconds: 420,
    transcript: [
      {
        id: uid(),
        at: timestamp,
        speaker: "Interviewer",
        text: "Describe your document search project.",
      },
      {
        id: uid(),
        at: timestamp,
        speaker: "You",
        text: "I built a document search service with citation grounding. I compared retrieval settings using an evaluation set and recorded errors for review.",
      },
    ],
    questions: ["Describe your document search project."],
    responses: [],
    notes: ["Practice explaining evaluation tradeoffs."],
    summary:
      "Fictional practice: Alex discussed document search and evaluation. Next practice: explain retrieval tradeoffs.",
    feedbackId: uid(),
    actions: [],
    decisions: [],
  };
  const meeting: SessionType = {
    ...session,
    id: uid(),
    type: "meeting",
    title: "Sample: Evaluation planning",
    transcript: [
      {
        id: uid(),
        at: timestamp,
        speaker: "Team",
        text: "We agreed to review retrieval errors before changing the model.",
      },
    ],
    questions: [],
    notes: [
      "Decision: Review retrieval errors first.",
      "Action: Alex will prepare examples for Friday.",
    ],
    summary:
      "The team agreed to review retrieval errors. Alex will prepare examples for Friday.",
    actions: ["Alex will prepare examples for Friday."],
    decisions: ["Review retrieval errors first."],
  };
  return {
    schemaVersion: 1,
    user: {
      name: "Alex Morgan",
      email: "alex@example.com",
      role: "AI Engineer",
      goal: "Prepare for machine learning interviews",
      resume:
        "AI engineer with experience building retrieval systems and model evaluation pipelines.",
      companyContext: "Northstar Labs builds reliable tools for data teams.",
      projects:
        "Built a document search service with citation grounding and an evaluation suite.",
      jobDescription:
        "Build reliable Python services, retrieval pipelines, and model evaluation workflows.",
      interviewType: "Technical",
    },
    onboarding: true,
    settings: { ...emptyState.settings },
    sessions: [session, meeting],
    memories: [
      {
        id: uid(),
        title: "Document search service",
        content:
          "I built retrieval with citation grounding and measured answer quality with a small evaluation set.",
        type: "Project",
        tags: ["RAG", "evaluation"],
        createdAt: timestamp,
        updatedAt: timestamp,
        pinned: true,
      },
      {
        id: uid(),
        title: "Evaluation review habit",
        content:
          "I record failed examples and review retrieval quality before changing prompts.",
        type: "Skill",
        tags: ["evaluation"],
        createdAt: timestamp,
        updatedAt: timestamp,
        pinned: false,
      },
    ],
    prep: [
      {
        id: uid(),
        company: "Northstar Labs",
        role: "Machine Learning Engineer",
        jobDescription:
          "Build reliable Python services, retrieval pipelines, and model evaluation workflows.",
        companyContext: "Northstar Labs builds reliable tools for data teams.",
        projects: "Document search service with grounded citations.",
        interviewType: "Technical",
        createdAt: timestamp,
        questions: [
          "Describe your document search project.",
          "How did you evaluate retrieval quality?",
          "Explain a technical tradeoff.",
        ],
        notes: ["Use concrete examples from the evaluation set."],
      },
    ],
    activeSessionId: null,
  };
};
