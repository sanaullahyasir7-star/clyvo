import { AppState, ResponseType, SessionType, uid, now } from "@/lib/model";
export interface AIProvider {
  answer(
    question: string,
    state: AppState,
    session?: SessionType,
  ): ResponseType;
  prepare(role: string, company: string, type: string): string[];
  feedback(session: SessionType): string[];
}
const intents: [RegExp, string][] = [
  [/tell me about yourself|introduce yourself/i, "introduction"],
  [/challenge|difficult|problem/i, "challenge"],
  [/project|built|worked on/i, "project"],
  [/lead|team|leadership/i, "leadership"],
  [/conflict|disagree/i, "conflict"],
  [/strength/i, "strength"],
  [/weakness/i, "weakness"],
  [/why.*(company|here|us)/i, "why-company"],
  [/salary|compensation/i, "salary"],
  [/system design|architecture|scale/i, "system-design"],
  [/code|algorithm|complexity/i, "coding"],
  [/technical|explain|what is/i, "technical"],
  [/summary|summarize/i, "summary"],
  [/action items|next steps/i, "action-items"],
];
export const detectIntent = (q: string) =>
  intents.find(([re]) => re.test(q))?.[1] ??
  (q.trim().endsWith("?") ? "general-question" : "general");
const clip = (s: string, n = 200) => s.trim().slice(0, n);
export const mockAIProvider: AIProvider = {
  answer(question, state, session) {
    const intent = detectIntent(question);
    const role =
      session?.role || state.prep[0]?.role || state.user?.role || "your role";
    const company =
      session?.company || state.prep[0]?.company || "the organization";
    const project =
      state.memories.find((m) => m.type === "Project")?.content ||
      state.user?.projects ||
      "";
    const resume = state.user?.resume || "";
    const job =
      state.prep[0]?.jobDescription || state.user?.jobDescription || "";
    const companyContext =
      state.prep[0]?.companyContext || state.user?.companyContext || "";
    const relevant =
      state.memories.find((m) =>
        question
          .toLowerCase()
          .split(/\W+/)
          .some(
            (w) =>
              w.length > 4 &&
              (m.title + " " + m.tags.join(" ")).toLowerCase().includes(w),
          ),
      )?.content || project;
    const context = clip(
      relevant || resume || "your own experience",
      150,
    ).replace(/[.!?]+$/, "");
    let main =
      "Answer directly, then give one specific example from your experience.";
    if (intent === "introduction")
      main = `Introduce your path toward ${role}. Mention ${context} and end with why this role fits your next step.`;
    else if (
      ["project", "technical", "coding", "system-design"].includes(intent)
    )
      main = `Use this relevant context: ${context}. Explain your choice, how you tested it, and what you would improve.`;
    else if (["challenge", "conflict", "leadership"].includes(intent))
      main = `Choose one real situation from your experience. Describe your role, a concrete action, and an outcome you can verify. ${relevant ? `Relevant context: ${clip(relevant, 100)}` : ""}`;
    else if (intent === "why-company")
      main = `Connect your interest in ${company} with the ${role} work. ${companyContext ? `Use your saved context: ${clip(companyContext, 140)}.` : "Mention one company fact you have verified."} Connect it to a skill you can contribute.`;
    else if (intent === "weakness")
      main =
        "Choose a genuine area you are improving. Give a recent example of the steps you took and what changed.";
    else if (intent === "strength")
      main = `Choose a strength supported by your experience. ${relevant ? `For example: ${clip(relevant, 100)}` : "Add a specific example before speaking."}`;
    else if (intent === "salary")
      main =
        "Ask about the scope and compensation range for the role. State a range only if you have researched it and are comfortable sharing it.";
    else if (intent === "summary")
      main = `Summarize the key points from the conversation: ${clip(
        session?.transcript
          .slice(-4)
          .map((t) => t.text)
          .join(" ") || "No transcript recorded yet.",
      )}`;
    else if (intent === "action-items")
      main =
        "List each confirmed action, its owner, and due date. Mark anything unconfirmed as a question.";
    const short = main;
    const star = `Situation: Pick a real example connected to ${clip(context, 90)}.\nTask: State what you were responsible for.\nAction: Explain two specific steps you took.\nResult: Share the outcome only if you can verify it.`;
    const details = `Question: ${question}\nContext: ${context}\nRole requirements: ${clip(job) || "Not added"}\nCompany context: ${clip(companyContext) || "Not added"}\nRecent conversation: ${clip(
      session?.transcript
        .slice(-2)
        .map((t) => t.text)
        .join(" ") || "No earlier transcript",
    )}\nSuggested structure: State your point first. Give one concrete example. Explain your decision and evidence. Close with what you learned.\nCheck: Replace any placeholder with your actual experience before saying it.`;
    return {
      id: uid(),
      question,
      intent,
      short,
      star,
      details,
      talkingPoints: [
        `Address the ${intent.replaceAll("-", " ")} directly`,
        relevant ? `Use: ${clip(relevant, 100)}` : "Use one real example",
        `Tie it to ${role}${company ? ` at ${company}` : ""}`,
      ],
      followUps: [
        "What was your specific contribution?",
        "How did you measure the outcome?",
      ],
      at: now(),
      pinned: false,
    };
  },
  prepare(role, company, type) {
    return [
      `Tell me about yourself and why ${role} interests you.`,
      `Describe a project that prepares you for ${role}.`,
      `What challenge did you face and how did you handle it?`,
      `Why do you want to work at ${company || "this company"}?`,
      type === "Technical"
        ? "Explain a technical decision and its tradeoffs."
        : "Tell me about a time you worked with others.",
    ];
  },
  feedback(session) {
    const count = session.transcript.filter((x) => x.speaker === "You").length;
    return [
      `${session.questions.length} question${session.questions.length === 1 ? "" : "s"} recorded.`,
      count
        ? `You contributed ${count} transcript segment${count === 1 ? "" : "s"}. Review them for clear examples.`
        : "No spoken or typed responses were recorded. Add your own answer to receive more specific review.",
      session.notes.length
        ? `You saved ${session.notes.length} note${session.notes.length === 1 ? "" : "s"}.`
        : "Consider recording concrete evidence and next steps.",
    ];
  },
};
