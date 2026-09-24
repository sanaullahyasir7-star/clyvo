"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, History, Trash2 } from "lucide-react";
import { useApp } from "@/providers/app";
import { PrepType, now, uid } from "@/lib/model";
import { Card, Empty, SectionTitle, time } from "@/components/ui";
export default function HistoryPage() {
  const { state, update } = useApp();
  const params = useSearchParams();
  const selected = state.sessions.find((s) => s.id === params.get("id"));
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Newest");
  const sessions = state.sessions
    .filter(
      (s) =>
        (filter === "All" || s.type === filter) &&
        (s.title + " " + s.summary).toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "Newest"
        ? b.startedAt.localeCompare(a.startedAt)
        : a.startedAt.localeCompare(b.startedAt),
    );
  return (
    <>
      <SectionTitle
        title="Conversation history"
        subtitle="Review the work you saved."
      />
      {selected && (
        <Card className="detail-card">
          <div className="panel-title">
            <h2>{selected.title}</h2>
            <Link href="/history" className="text-link">
              Close
            </Link>
          </div>
          <p className="muted">
            {selected.type} · {time(selected.startedAt)} · {selected.status}
          </p>
          <p>{selected.summary || "Session in progress."}</p>
          <h3>Transcript</h3>
          {selected.transcript.map((t) => (
            <div className="transcript" key={t.id}>
              <small>{t.speaker}</small>
              <p>{t.text}</p>
            </div>
          ))}
          <h3>Suggestions</h3>
          {selected.responses.map((r) => (
            <div className="note" key={r.id}>
              <strong>{r.question}</strong>
              <p>{r.short}</p>
            </div>
          ))}
          <h3>Decisions and actions</h3>
          {selected.decisions.map((n, i) => (
            <div className="note" key={`decision-${i}`}>
              Decision: {n}
            </div>
          ))}
          {selected.actions.map((n, i) => (
            <div className="note" key={`action-${i}`}>
              Action: {n}
            </div>
          ))}
          <h3>Notes</h3>
          {selected.notes.map((n, i) => (
            <div className="note" key={i}>
              {n}
            </div>
          ))}
          <Link
            className="button secondary"
            href={`/feedback?id=${selected.id}`}
          >
            View feedback <ArrowRight size={16} />
          </Link>
        </Card>
      )}
      <div className="filter-row">
        <input
          aria-label="Search history"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sessions"
        />
        <select
          aria-label="Filter session type"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["All", "live", "interview", "meeting"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          aria-label="Sort sessions"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option>Newest</option>
          <option>Oldest</option>
        </select>
      </div>
      {sessions.length ? (
        sessions.map((s) => (
          <div className="history-item" key={s.id}>
            <Link href={`/history?id=${s.id}`}>
              <span className="list-icon">
                <History size={18} />
              </span>
              <span>
                <strong>{s.title}</strong>
                <small>
                  {s.type} · {time(s.startedAt)} · {s.questions.length}{" "}
                  questions
                </small>
              </span>
            </Link>
            <div className="row">
              <button
                aria-label={`Rename ${s.title}`}
                onClick={() => {
                  const v = window.prompt("Rename session", s.title);
                  if (v?.trim())
                    update((a) => ({
                      ...a,
                      sessions: a.sessions.map((x) =>
                        x.id === s.id ? { ...x, title: v.trim() } : x,
                      ),
                    }));
                }}
              >
                Rename
              </button>
              <button
                aria-label={`Reuse ${s.title} as prep`}
                onClick={() => {
                  const p: PrepType = {
                    id: uid(),
                    company: s.company,
                    role: s.role,
                    jobDescription: "",
                    companyContext: "",
                    projects: "",
                    interviewType: "Mixed",
                    createdAt: now(),
                    questions: s.questions,
                    notes: s.notes,
                  };
                  update((a) => ({ ...a, prep: [p, ...a.prep] }));
                  window.alert("Saved to interview prep.");
                }}
              >
                Reuse
              </button>
              <button
                aria-label={`Delete ${s.title}`}
                onClick={() => {
                  if (window.confirm(`Delete “${s.title}”?`))
                    update((a) => ({
                      ...a,
                      sessions: a.sessions.filter((x) => x.id !== s.id),
                      activeSessionId:
                        a.activeSessionId === s.id ? null : a.activeSessionId,
                    }));
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))
      ) : (
        <Empty
          title="No conversations yet"
          copy="Completed sessions will appear here."
        />
      )}
    </>
  );
}
