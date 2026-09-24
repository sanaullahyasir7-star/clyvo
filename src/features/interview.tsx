"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/providers/app";
import { PrepType, SessionType, now, uid } from "@/lib/model";
import { mockAIProvider } from "@/providers/ai";
import { browserSpeechProvider } from "@/providers/transcription";
import {
  Button,
  Card,
  Empty,
  SectionTitle,
  Field,
  createSession,
} from "@/components/ui";
export default function Interview() {
  const { state, update, setError } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const saved =
    state.prep.find((p) => p.id === params.get("id")) || state.prep[0];
  const [company, setCompany] = useState(saved?.company || "");
  const [role, setRole] = useState(saved?.role || state.user?.role || "");
  const [job, setJob] = useState(
    saved?.jobDescription || state.user?.jobDescription || "",
  );
  const [difficulty, setDifficulty] = useState("Standard");
  const practiceSpeech = useRef(browserSpeechProvider());
  useEffect(() => () => practiceSpeech.current.stop(), []);
  const [context, setContext] = useState(state.user?.companyContext || "");
  const [projects, setProjects] = useState(state.user?.projects || "");
  const [kind, setKind] = useState(
    saved?.interviewType || state.user?.interviewType || "Mixed",
  );
  const draft = state.sessions.find(
    (s) => s.type === "interview" && s.status !== "completed",
  );
  const [practice, setPractice] = useState(!!draft);
  const [index, setIndex] = useState(draft?.questions.length || 0);
  const [answer, setAnswer] = useState("");
  const [responses, setResponses] = useState<string[]>(
    draft?.transcript.filter((t) => t.speaker === "You").map((t) => t.text) ||
      [],
  );
  const [practiceSession, setPracticeSession] = useState<SessionType | null>(
    draft || null,
  );
  useEffect(() => {
    if (practiceSession)
      update((s) => ({
        ...s,
        sessions: [
          practiceSession,
          ...s.sessions.filter((x) => x.id !== practiceSession.id),
        ],
      }));
  }, [practiceSession, update]);
  const latest =
    state.prep.find((p) => p.id === params.get("id")) || state.prep[0];
  const questions =
    latest?.questions || mockAIProvider.prepare(role, company, kind);
  function prepare() {
    const p: PrepType = {
      id: uid(),
      company,
      role,
      jobDescription: job,
      companyContext: context,
      projects,
      interviewType: kind,
      createdAt: now(),
      questions: mockAIProvider.prepare(role, company, kind),
      notes: [],
    };
    update((s) => ({
      ...s,
      prep: [p, ...s.prep],
      user: s.user ? { ...s.user, companyContext: context, projects } : null,
    }));
    setIndex(0);
  }
  function savePractice() {
    const s =
      practiceSession ||
      createSession(
        "interview",
        `Practice: ${role || "Interview"}`,
        company,
        role,
      );
    const finished = {
      ...s,
      status: "completed" as const,
      endedAt: now(),
      durationSeconds: Math.max(
        0,
        Math.floor((Date.now() - new Date(s.startedAt).getTime()) / 1000),
      ),
      summary: `Practice session: ${responses.length} answers for ${role || "an interview"}.`,
      feedbackId: uid(),
    };
    update((a) => ({
      ...a,
      sessions: [finished, ...a.sessions.filter((x) => x.id !== finished.id)],
    }));
    setPractice(false);
    setPracticeSession(null);
    setResponses([]);
    setIndex(0);
  }
  return (
    <>
      <SectionTitle
        title="Interview preparation"
        subtitle="Build a useful brief before the conversation."
        action={
          <Button variant="secondary" onClick={() => setPractice((v) => !v)}>
            {practice ? "Back to prep" : "Practice mode"}{" "}
            <ArrowRight size={16} />
          </Button>
        }
      />
      {practice ? (
        <div className="practice-layout">
          <Card>
            <span className="eyebrow">
              QUESTION {Math.min(index + 1, questions.length)} /{" "}
              {questions.length}
            </span>
            <h2>{questions[Math.min(index, questions.length - 1)]}</h2>
            <label className="field">
              <span>Difficulty</span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option>Standard</option>
                <option>Advanced</option>
              </select>
            </label>
            {difficulty === "Advanced" && (
              <p className="muted">
                Include tradeoffs, alternatives, and how you would validate your
                decision.
              </p>
            )}
            <Field
              label="Your response"
              value={answer}
              onChange={setAnswer}
              multiline
              placeholder="Write your own answer here."
            />
            <div className="row">
              <Button
                variant="secondary"
                onClick={() =>
                  practiceSpeech.current.start(
                    (t) => setAnswer((a) => a + " " + t),
                    setError,
                  )
                }
              >
                Dictate answer
              </Button>
              <Button
                variant="secondary"
                onClick={() => practiceSpeech.current.stop()}
              >
                Stop dictation
              </Button>
              <Button
                disabled={
                  !answer.trim() || responses.length >= questions.length
                }
                onClick={() => {
                  const q = questions[index];
                  const response = mockAIProvider.answer(q, state);
                  const s =
                    practiceSession ||
                    createSession(
                      "interview",
                      `Practice: ${role || "Interview"}`,
                      company,
                      role,
                    );
                  setPracticeSession({
                    ...s,
                    transcript: [
                      ...s.transcript,
                      { id: uid(), at: now(), speaker: "You", text: answer },
                    ],
                    questions: [...s.questions, q],
                    responses: [...s.responses, response],
                  });
                  setResponses([...responses, answer]);
                  setAnswer("");
                  setIndex(Math.min(index + 1, questions.length - 1));
                }}
              >
                Save answer & next
              </Button>
              <Button
                variant="secondary"
                disabled={!responses.length}
                onClick={savePractice}
              >
                Finish practice
              </Button>
            </div>
          </Card>
          <Card>
            <h3>Practice feedback</h3>
            {responses.length ? (
              <>
                <div className="note">
                  {responses.at(-1)!.trim().split(/\s+/).length < 30
                    ? "Your last answer is brief. Add one concrete example and explain your own action."
                    : "Your answer contains detail. Check that the main point comes first and remove repeated phrases."}
                </div>
                <p>
                  You have answered {responses.length} question
                  {responses.length === 1 ? "" : "s"}.
                </p>
                <p>
                  Check whether each answer names your own action and a result
                  you can verify. CLYVO does not score answers without evidence.
                </p>
                <strong>Better phrasing prompt</strong>
                <p>
                  “I was responsible for [specific action]. I chose [approach]
                  because [reason]. The result was [verified outcome].”
                </p>
                <strong>Follow-up</strong>
                <p>How did you decide whether your approach worked?</p>
              </>
            ) : (
              <Empty
                title="Start with your own words"
                copy="Write an answer and CLYVO will offer a review prompt."
              />
            )}
          </Card>
        </div>
      ) : (
        <>
          <div className="two-col">
            <Card>
              <h2>Role context</h2>
              <div className="form-grid">
                <Field
                  label="Company"
                  value={company}
                  onChange={setCompany}
                  placeholder="Company name"
                />
                <Field
                  label="Role"
                  value={role}
                  onChange={setRole}
                  placeholder="Role title"
                />
                <label className="field">
                  <span>Interview type</span>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                  >
                    {[
                      "Mixed",
                      "Behavioral",
                      "Technical",
                      "Coding",
                      "System Design",
                      "HR",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <Field
                  label="Job description"
                  value={job}
                  onChange={setJob}
                  multiline
                  placeholder="Paste the relevant requirements"
                />
                <Field
                  label="Company context"
                  value={context}
                  onChange={setContext}
                  multiline
                />
                <Field
                  label="Relevant projects"
                  value={projects}
                  onChange={setProjects}
                  multiline
                />
              </div>
              <Button onClick={prepare}>
                Generate local prep <ArrowRight size={16} />
              </Button>
            </Card>
            <div>
              <Card>
                <h2>Likely questions</h2>
                <p className="muted">
                  Based on the role and interview type. Check company specific
                  details yourself.
                </p>
                {questions.map((q, i) => (
                  <div className="numbered" key={q}>
                    <span>0{i + 1}</span>
                    {q}
                  </div>
                ))}
              </Card>
              <Card>
                <h3>Relevant projects</h3>
                <p>
                  Connect your role to a real project:{" "}
                  {projects ||
                    state.user?.projects ||
                    "Add a project to make this useful."}
                </p>
                <h3>Skills to emphasize</h3>
                <p>
                  {job
                    ? job
                        .split(/[.,;\n]/)
                        .filter(Boolean)
                        .slice(0, 3)
                        .join(" · ")
                    : "Add the job description to identify the skills to discuss."}
                </p>
                <h3>Preparation notes</h3>
                <p>
                  Explain decisions, results, and what you learned. Confirm
                  company facts before your interview.
                </p>
                <h3>Suggested answer structure</h3>
                <p>
                  {
                    mockAIProvider.answer(
                      questions[0] || "Tell me about yourself",
                      state,
                    ).short
                  }
                </p>
                <h3>Potential follow-ups</h3>
                <p>
                  What was your contribution? How did you measure the result?
                </p>
                <Button
                  variant="secondary"
                  onClick={() => router.push("/live")}
                >
                  Start Live <ArrowRight size={16} />
                </Button>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}
