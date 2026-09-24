"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { useApp } from "@/providers/app";
import { localSearchProvider } from "@/providers/search";
import { Empty, SectionTitle, time, Highlight } from "@/components/ui";
export default function SearchPage() {
  const { state } = useApp();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [after, setAfter] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 180);
    return () => clearTimeout(t);
  }, [query]);
  const results = useMemo(
    () =>
      localSearchProvider
        .query(state, debounced, type)
        .filter((r) => !after || r.date.slice(0, 10) >= after),
    [state, debounced, type, after],
  );
  return (
    <>
      <SectionTitle
        title="Search"
        subtitle="Find context across your saved work."
      />
      <div className="search-large">
        <Search size={20} />
        <input
          autoFocus
          aria-label="Search CLYVO"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sessions, questions, memories…"
        />
      </div>
      <div className="tabs filter-tabs">
        {[
          "All",
          "Session",
          "Meeting",
          "Transcript",
          "Question",
          "Memory",
          "Prep",
          "Note",
        ].map((t) => (
          <button
            key={t}
            className={type === t ? "active" : ""}
            onClick={() => setType(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <label className="field feedback-select">
        <span>From date</span>
        <input
          type="date"
          value={after}
          onChange={(e) => setAfter(e.target.value)}
        />
      </label>
      <p className="muted small-text">
        {results.length} result{results.length === 1 ? "" : "s"}
      </p>
      {results.length ? (
        results.map((r) => (
          <Link className="search-result" key={r.id} href={r.href}>
            <span className="tag">{r.type}</span>
            <div>
              <h3>
                <Highlight text={r.title} query={debounced} />
              </h3>
              <p>
                <Highlight
                  text={r.excerpt.slice(0, 200) || "No summary yet"}
                  query={debounced}
                />
              </p>
              <small>{time(r.date)}</small>
            </div>
            <ArrowRight size={17} />
          </Link>
        ))
      ) : (
        <Empty title="No search results" copy="Try another phrase or filter." />
      )}
    </>
  );
}
