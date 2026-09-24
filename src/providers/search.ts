import { AppState } from "@/lib/model";
export interface SearchResult {
  id: string;
  type: string;
  title: string;
  excerpt: string;
  href: string;
  date: string;
}
export interface SearchProvider {
  query(state: AppState, query: string, type?: string): SearchResult[];
}
export const localSearchProvider: SearchProvider = {
  query(state, q, type) {
    const items: SearchResult[] = [
      ...state.memories.map((m) => ({
        id: m.id,
        type: "Memory",
        title: m.title,
        excerpt: m.content + " " + m.tags.join(" "),
        href: `/memory?id=${m.id}`,
        date: m.updatedAt,
      })),
      ...state.sessions.flatMap((s) => [
        {
          id: s.id,
          type: s.type === "meeting" ? "Meeting" : "Session",
          title: s.title,
          excerpt: s.summary,
          href: `/history?id=${s.id}`,
          date: s.startedAt,
        },
        ...s.transcript.map((t) => ({
          id: t.id,
          type: "Transcript",
          title: s.title,
          excerpt: t.text,
          href: `/history?id=${s.id}`,
          date: t.at,
        })),
        ...s.notes.map((n, i) => ({
          id: `${s.id}-note-${i}`,
          type: "Note",
          title: s.title,
          excerpt: n,
          href: `/history?id=${s.id}`,
          date: s.startedAt,
        })),
        ...s.responses.map((r) => ({
          id: r.id,
          type: "Question",
          title: r.question,
          excerpt: r.short,
          href: `/history?id=${s.id}`,
          date: r.at,
        })),
      ]),
      ...state.prep.map((p) => ({
        id: p.id,
        type: "Prep",
        title: `${p.role} · ${p.company}`,
        excerpt: p.jobDescription + " " + p.notes.join(" "),
        href: `/interview?id=${p.id}`,
        date: p.createdAt,
      })),
    ];
    const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return items
      .filter(
        (i) =>
          (!type || type === "All" || i.type === type) &&
          (!terms.length ||
            terms.every((t) =>
              (i.title + " " + i.excerpt).toLowerCase().includes(t),
            )),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  },
};
