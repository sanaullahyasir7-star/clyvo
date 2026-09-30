import { reviewAnswer } from "./review";
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

function evidenceSentence(question: string, context: string): string {
  if (!context) return "I don’t have a matching example in the CV details saved here, so I’d answer this with a real example from my experience.";
  const first = context.split(/(?<=[.!?])\s+/)[0]?.trim() || context;
  const clean = first.replace(/[.!?]+$/, "");
  if (/tell me about yourself|introduce yourself/i.test(question))
    return `I’m an early-career professional focused on this role, and one relevant part of my background is ${clean}.`;
  if (/project|built|worked on|challenge|difficult|problem/i.test(question))
    return `One example from my experience is ${clean}. I can explain my specific contribution, the decisions I made, and the result I can verify.`;
  if (/strength/i.test(question))
    return `A strength I can support with an example is the work reflected in ${clean}. I would describe my own contribution and the evidence for its impact.`;
  if (/why.*(company|here|us)/i.test(question))
    return `This role interests me because it connects with my experience in ${clean}. I’d like to apply that background while learning the team’s specific needs.`;
  return `Based on my saved experience, ${clean}. I would connect this example to the question and be clear about what I personally did.`;
}
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
    let main = evidenceSentence(question, context);
    if (intent === "introduction")
      main = `${evidenceSentence(question, context)} I’m interested in ${role} because it is a next step where I can contribute and keep growing.`;
    else if (
      ["project", "technical", "coding", "system-design"].includes(intent)
    )
      main = `${evidenceSentence(question, context)} I would explain the approach, tradeoffs, how I tested it, and what I would improve. Those details should match what I actually did.`;
    else if (["challenge", "conflict", "leadership"].includes(intent))
      main = `${evidenceSentence(question, context)} I would then explain the situation, my responsibility, the action I took, and only an outcome I can verify.`;
    else if (intent === "why-company")
      main = `${evidenceSentence(question, context)} I’m interested in ${company} and the ${role} work. ${companyContext ? `A company detail I have saved is: ${clip(companyContext, 140)}.` : "I would add one current company fact I have verified."} I’d connect that to a skill I can contribute.`;
    else if (intent === "weakness")
      main = "One area I’m working to improve is [name a genuine skill]. Recently, I [specific step you took], and I’m checking progress by [honest measure]. Replace the brackets with a true example before using this draft.";
    else if (intent === "strength")
      main = `${evidenceSentence(question, context)} I’d keep the example specific and explain how it would help in ${role}.`;
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
    const target = role.trim() || "this role";
    const employer = company.trim() || "this company";
    const banks: Record<string, string[]> = {
      Behavioral: [
        "Tell me about a difficult situation and the action you took.",
        "Describe a disagreement and how you handled it.",
        "Tell me about a time you had to change your plan.",
        "Describe a mistake, its impact, and what you learned.",
        "How did you help a team deliver something important?",
      ],
      Technical: [
        `Walk through a technical project relevant to ${target}.`,
        "Explain a technical decision, the alternatives, and your tradeoffs.",
        "How did you test correctness and handle failures?",
        "Describe how you investigated a difficult bug.",
        "What would you improve in your implementation and why?",
      ],
      Coding: [
        "Given a list of numbers and a target, explain how you would find two entries whose sum equals the target.",
        "How would you detect repeated values in a large dataset? Explain time and space costs.",
        "Explain a solution for finding the first non-repeating character in a string.",
        "How would you test an algorithm against empty input, duplicates, and boundary values?",
        "Compare a simple solution with a faster one. When is the extra complexity justified?",
      ],
      "System Design": [
        "Design a URL shortener. Start with requirements and scale assumptions.",
        "Describe the API, data model, and request flow for your design.",
        "How would your design handle retries and duplicate requests?",
        "Which component would become a bottleneck first, and how would you measure it?",
        "Explain your consistency, availability, privacy, and recovery tradeoffs.",
      ],
      HR: [
        `Why are you interested in ${target} at ${employer}?`,
        "What working environment helps you do your best work?",
        "How do you prioritize competing deadlines?",
        "What are your availability and expectations for this role?",
        "What would you like to ask the hiring team?",
      ],
      Mixed: [
        `Tell me about yourself and why ${target} interests you.`,
        `Describe a project that prepares you for ${target}.`,
        "What challenge did you face and how did you handle it?",
        `Why do you want to work at ${employer}?`,
        "Explain a decision you made and how you evaluated the result.",
      ],
    };
    return banks[type] || banks.Mixed;
  },
  feedback(session) {
    const count = session.transcript.filter((x) => x.speaker === "You").length;
    const review = reviewAnswer(
      session.transcript
        .filter((x) => x.speaker === "You")
        .map((x) => x.text)
        .join(" "),
    );
    return [
      ...(count ? [...review.observations, ...review.nextSteps] : []),
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
