"use client";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  AudioLines,
  Brain,
  ChevronRight,
  MessageSquareText,
} from "lucide-react";
import { useApp } from "@/providers/app";
import { ClyvoSymbol } from "@/components/brand";
import { Card, Empty, SectionTitle, time } from "@/components/ui";
export default function Dashboard() {
  const { state } = useApp();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const completed = state.sessions.filter((s) => s.status === "completed");
  return (
    <>
      <SectionTitle
        title={`${greeting}, ${state.user?.name.split(" ")[0]}.`}
        subtitle="Ready for your next conversation?"
      />
      <div className="hero-card">
        <div>
          <span className="eyebrow">YOUR WORKSPACE IS READY</span>
          <h2>
            Stay with the conversation.
            <br />
            Keep the context close.
          </h2>
          <p>Prepare with your experience and save what matters afterward.</p>
          <Link className="button" href="/live">
            Start a conversation <ArrowRight size={17} />
          </Link>
        </div>
        <ClyvoSymbol size={112} />
      </div>
      <div className="quick-grid">
        {[
          ["Start Live", "/live", AudioLines],
          ["Prepare Interview", "/interview", MessageSquareText],
          ["Start Meeting", "/meetings", Activity],
          ["Add Memory", "/memory", Brain],
        ].map(([title, href, Icon]) => (
          <Link
            className="quick-card"
            href={href as string}
            key={title as string}
          >
            <Icon size={21} />
            <strong>{title as string}</strong>
            <ArrowRight size={16} />
          </Link>
        ))}
      </div>
      <div className="stats">
        <Card>
          <span>COMPLETED SESSIONS</span>
          <strong>{completed.length}</strong>
        </Card>
        <Card>
          <span>SAVED MEMORIES</span>
          <strong>{state.memories.length}</strong>
        </Card>
        <Card>
          <span>QUESTIONS CAPTURED</span>
          <strong>
            {state.sessions.reduce((n, s) => n + s.questions.length, 0)}
          </strong>
        </Card>
      </div>
      <div className="two-col">
        <div>
          <h3 className="block-title">
            Recent sessions{" "}
            <Link href="/history">
              View all <ArrowRight size={14} />
            </Link>
          </h3>
          {state.sessions.length ? (
            state.sessions.slice(0, 3).map((s) => (
              <Link
                className="list-card"
                href={`/history?id=${s.id}`}
                key={s.id}
              >
                <span className="list-icon">
                  <AudioLines size={18} />
                </span>
                <span>
                  <strong>{s.title}</strong>
                  <small>
                    {time(s.startedAt)} · {s.status}
                  </small>
                </span>
                <ChevronRight size={16} />
              </Link>
            ))
          ) : (
            <Empty
              title="No conversations yet"
              copy="Your sessions will appear here."
            />
          )}
        </div>
        <div>
          <h3 className="block-title">
            Your context{" "}
            <Link href="/memory">
              Open memory <ArrowRight size={14} />
            </Link>
          </h3>
          {state.memories.length ? (
            state.memories.slice(0, 3).map((m) => (
              <Link className="list-card" href="/memory" key={m.id}>
                <span className="list-icon">
                  <Brain size={18} />
                </span>
                <span>
                  <strong>{m.title}</strong>
                  <small>
                    {m.type} · {m.tags.join(", ") || "No tags"}
                  </small>
                </span>
                <ChevronRight size={16} />
              </Link>
            ))
          ) : (
            <Empty
              title="No memories yet"
              copy="Save context to make suggestions more useful."
            />
          )}
        </div>
      </div>
    </>
  );
}
