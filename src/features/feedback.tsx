"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/providers/app";
import { mockAIProvider } from "@/providers/ai";
import { Card, Empty, SectionTitle, time } from "@/components/ui";
export default function Feedback() {
  const { state } = useApp();
  const params = useSearchParams();
  const [id, setId] = useState("");
  const completed = state.sessions.filter((s) => s.status === "completed");
  const target =
    completed.find((s) => s.id === (id || params.get("id"))) || completed[0];
  return (
    <>
      <SectionTitle
        title="Feedback"
        subtitle="A descriptive review based on saved session data."
      />
      {completed.length ? (
        <>
          <label className="field feedback-select">
            <span>Choose session</span>
            <select
              value={target?.id || ""}
              onChange={(e) => setId(e.target.value)}
            >
              {completed.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} · {time(s.startedAt)}
                </option>
              ))}
            </select>
          </label>
          {target && (
            <div className="two-col">
              <Card>
                <span className="eyebrow">SESSION SUMMARY</span>
                <h2>{target.title}</h2>
                <p>{target.summary}</p>
                <h3>What was captured</h3>
                {mockAIProvider.feedback(target).map((x) => (
                  <div className="note" key={x}>
                    {x}
                  </div>
                ))}
                <h3>Questions asked</h3>
                {target.questions.length ? (
                  target.questions.map((q, i) => (
                    <div className="numbered" key={i}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      {q}
                    </div>
                  ))
                ) : (
                  <p className="muted">No questions were captured.</p>
                )}
              </Card>
              <Card>
                <span className="eyebrow">NEXT PRACTICE</span>
                <h2>Make answers concrete.</h2>
                <p>
                  Look at each question and check whether you gave a specific
                  example from your own experience.
                </p>
                <h3>Better phrasing</h3>
                <p>
                  “My part was [your action]. I chose [approach] because
                  [reason]. We observed [verified result].”
                </p>
                <h3>Potential missed points</h3>
                <p>
                  {target.notes.length
                    ? "Review your saved notes for follow-up items."
                    : "No notes were saved. Capture decisions or follow-up points next time."}
                </p>
                <Link className="button secondary" href="/interview">
                  Practice again <ArrowRight size={16} />
                </Link>
              </Card>
            </div>
          )}
        </>
      ) : (
        <Empty
          title="No feedback yet"
          copy="Finish a conversation, meeting, or practice session to see a review."
          action={
            <Link className="button" href="/live">
              Start Live
            </Link>
          }
        />
      )}
    </>
  );
}
