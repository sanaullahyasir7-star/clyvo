"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, ChevronRight } from "lucide-react";
import { useApp } from "@/providers/app";
import { meetingNotes } from "@/providers/review";
import { SessionType, now, uid } from "@/lib/model";
import {
  Button,
  Card,
  Empty,
  SectionTitle,
  Field,
  time,
  createSession,
} from "@/components/ui";
export default function Meetings() {
  const { state, update } = useApp();
  const draft = state.sessions.find(
    (s) => s.type === "meeting" && s.status !== "completed",
  );
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState(draft?.participants || "");
  const [context, setContext] = useState(draft?.context || "");
  const [note, setNote] = useState(draft?.draftNote || "");
  const [line, setLine] = useState(draft?.draftLine || "");
  const [meeting, setMeeting] = useState<SessionType | null>(draft || null);
  const [demo, setDemo] = useState(0);
  useEffect(() => {
    if (meeting)
      update((s) => ({
        ...s,
        sessions: [meeting, ...s.sessions.filter((x) => x.id !== meeting.id)],
      }));
  }, [meeting, update]);
  function finish() {
    if (!meeting) return;
    const notes = note.trim() ? [...meeting.notes, note.trim()] : meeting.notes;
    const transcript = line.trim()
      ? [
          ...meeting.transcript,
          { id: uid(), at: now(), speaker: "Participant", text: line.trim() },
        ]
      : meeting.transcript;
    const { actions, decisions } = meetingNotes(notes);
    const summary = `${meeting.title}. ${meeting.transcript.length} transcript lines. Key points: ${
      transcript
        .slice(0, 3)
        .map((t) => t.text)
        .join(" ") || "No transcript recorded."
    } Decisions: ${decisions.join("; ") || "None recorded."} Action items: ${actions.join("; ") || "None recorded."} Participants: ${participants || "not specified"}. Context: ${context || "not specified"}.`;
    const ended = {
      ...meeting,
      notes,
      transcript,
      draftNote: "",
      draftLine: "",
      durationSeconds: Math.max(
        0,
        Math.floor((Date.now() - new Date(meeting.startedAt).getTime()) / 1000),
      ),
      status: "completed" as const,
      endedAt: now(),
      summary,
      feedbackId: uid(),
      actions,
      decisions,
    };
    update((s) => ({
      ...s,
      sessions: [ended, ...s.sessions.filter((x) => x.id !== ended.id)],
    }));
    setMeeting(null);
    setNote("");
    setLine("");
    setDemo(0);
  }
  const lines = [
    "Let us review the project status.",
    "We need to decide on the next milestone.",
    "I will share the draft by Friday.",
    "Can we confirm the owner for testing?",
  ];
  return (
    <>
      <SectionTitle
        title="Meetings"
        subtitle="Capture notes and make the next steps clear."
      />
      {meeting ? (
        <div className="two-col">
          <Card>
            <div className="panel-title">
              <h2>{meeting.title}</h2>
              <span className="dot" />
            </div>
            <p className="muted">{participants || "No participants listed"}</p>
            <h3>Transcript</h3>
            {meeting.transcript.length ? (
              meeting.transcript.map((t) => (
                <div className="transcript" key={t.id}>
                  <small>{t.speaker}</small>
                  <p>{t.text}</p>
                </div>
              ))
            ) : (
              <Empty
                title="No transcript yet"
                copy="Add a line or play the simulated meeting."
              />
            )}
            <form
              className="ask-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!line.trim()) return;
                setMeeting((m) =>
                  m
                    ? {
                        ...m,
                        draftLine: "",
                        transcript: [
                          ...m.transcript,
                          {
                            id: uid(),
                            at: now(),
                            speaker: "Participant",
                            text: line,
                          },
                        ],
                      }
                    : null,
                );
                setLine("");
              }}
            >
              <input
                aria-label="Meeting transcript line"
                value={line}
                onChange={(e) => {
                  setLine(e.target.value);
                  setMeeting((m) =>
                    m ? { ...m, draftLine: e.target.value } : m,
                  );
                }}
                placeholder="Add a transcript line"
              />
              <Button type="submit">Add</Button>
            </form>
            <div className="row">
              <Button
                variant="secondary"
                disabled={demo >= lines.length}
                onClick={() => {
                  setMeeting((m) =>
                    m
                      ? {
                          ...m,
                          transcript: [
                            ...m.transcript,
                            {
                              id: uid(),
                              at: now(),
                              speaker: "Participant",
                              text: lines[demo],
                            },
                          ],
                        }
                      : null,
                  );
                  setDemo((n) => n + 1);
                }}
              >
                Next demo line
              </Button>
              <Button onClick={finish}>Finish meeting</Button>
            </div>
          </Card>
          <Card>
            <h3>Notes and decisions</h3>
            <Field
              label="New note"
              value={note}
              onChange={(v) => {
                setNote(v);
                setMeeting((m) => (m ? { ...m, draftNote: v } : m));
              }}
              multiline
            />
            <Button
              variant="secondary"
              onClick={() => {
                if (note.trim())
                  setMeeting((m) =>
                    m
                      ? { ...m, draftNote: "", notes: [...m.notes, note] }
                      : null,
                  );
                setNote("");
              }}
            >
              Save note
            </Button>
            {meeting.notes.map((n, i) => (
              <div className="note" key={i}>
                {n}
              </div>
            ))}
            <p className="muted">
              Use “Action:” or “Decision:” in a note to place it in the summary.
            </p>
          </Card>
        </div>
      ) : (
        <div className="two-col">
          <Card>
            <h2>Start a meeting</h2>
            <Field
              label="Meeting title"
              value={title}
              onChange={setTitle}
              placeholder="Project review"
            />
            <Field
              label="Participants"
              value={participants}
              onChange={setParticipants}
              placeholder="Names or roles"
            />
            <Field
              label="Context"
              value={context}
              onChange={setContext}
              multiline
            />
            <Button
              disabled={!title.trim()}
              onClick={() =>
                setMeeting({
                  ...createSession("meeting", title),
                  participants,
                  context,
                })
              }
            >
              Start meeting <ArrowRight size={16} />
            </Button>
          </Card>
          <div>
            <h3 className="block-title">Past meetings</h3>
            {state.sessions.filter((s) => s.type === "meeting").length ? (
              state.sessions
                .filter((s) => s.type === "meeting")
                .map((s) => (
                  <Link
                    href={`/history?id=${s.id}`}
                    className="list-card"
                    key={s.id}
                  >
                    <span className="list-icon">
                      <Activity size={18} />
                    </span>
                    <span>
                      <strong>{s.title}</strong>
                      <small>{time(s.startedAt)}</small>
                    </span>
                    <ChevronRight size={16} />
                  </Link>
                ))
            ) : (
              <Empty
                title="No meetings yet"
                copy="Finished meetings will appear here."
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
