import type { AppState, SessionType } from "@/lib/model";
export function boundedText(text: string, bytes: number) {
  const encoder = new TextEncoder();
  let result = "";
  for (const char of text) {
    const size = encoder.encode(char).length;
    if (size > bytes) break;
    result += char;
    bytes -= size;
  }
  return result;
}
export function selectEvidence(
  question: string,
  state: AppState,
  session?: SessionType,
) {
  const terms = new Set(
    question.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [],
  );
  const chunks = (text: string) => text.match(/[\s\S]{1,400}/g) || [];
  const prep = session?.prepContext;
  const candidates = [
    ...chunks(state.user?.resume || "").map((text) => ({
      source: "CV",
      text,
      boost: 0,
    })),
    ...chunks(prep?.jobDescription || state.user?.jobDescription || "").map(
      (text) => ({ source: "Job", text, boost: 1 }),
    ),
    ...chunks(prep?.companyContext || state.user?.companyContext || "").map(
      (text) => ({ source: "Company", text, boost: 0 }),
    ),
    ...chunks(prep?.projects || state.user?.projects || "").map((text) => ({
      source: "Projects",
      text,
      boost: 1,
    })),
    ...state.memories.flatMap((m) =>
      chunks(m.content).map((text) => ({
        source: `Memory: ${m.title.slice(0, 60)}`,
        text,
        boost: m.pinned ? 2 : 0,
      })),
    ),
  ];
  return candidates
    .map((c, index) => ({
      ...c,
      index,
      score:
        c.boost +
        [...terms].filter((t) => c.text.toLowerCase().includes(t)).length * 4,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 6);
}
export function buildReference(
  question: string,
  state: AppState,
  session?: SessionType,
) {
  const header = `Role: ${boundedText(session?.role || state.user?.role || "", 100)}\nCompany: ${boundedText(session?.company || "", 100)}\n`;
  const evidence = selectEvidence(question, state, session)
    .map((c) => `[${c.source}] ${c.text}`)
    .join("\n");
  return (
    header +
    boundedText(evidence, 1300) +
    "\nRecent transcript: " +
    boundedText(
      session?.transcript
        .slice(-2)
        .map((t) => `${t.speaker}: ${t.text}`)
        .join("\n") || "",
      200,
    )
  );
}
