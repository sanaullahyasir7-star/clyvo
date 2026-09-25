"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Brain,
  Copy,
  FileText,
  Mic,
  MicOff,
  Monitor,
  Pause,
  Pin,
  Play,
  Square,
} from "lucide-react";
import { useApp } from "@/providers/app";
import { MemoryType, now, uid } from "@/lib/model";
import { LocalAI, answerMessages } from "@/providers/local-ai";
import { LocalAIControls } from "@/components/local-ai-controls";
import { mockAIProvider } from "@/providers/ai";
import { browserSpeechProvider, demoLines } from "@/providers/transcription";
import {
  browserScreenProvider,
  mockScreenInterpreter,
} from "@/providers/screen";
import { ClyvoIndicator } from "@/components/brand";
import {
  Button,
  Card,
  Empty,
  SectionTitle,
  Field,
  createSession,
} from "@/components/ui";
export default function Live() {
  const { state, update, setError } = useApp();
  const active = state.sessions.find(
    (s) => s.id === state.activeSessionId && s.status !== "completed",
  );
  const localAI = useRef<LocalAI | null>(null);
  const [aiStatus, setAIStatus] = useState<"off" | "loading" | "ready" | "error">("off");
  const [aiProgress, setAIProgress] = useState("");
  const [aiError, setAIError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [streamed, setStreamed] = useState("");
  const [streamQuestion, setStreamQuestion] = useState("");
  const generation = useRef(0);
  const busy = useRef(false);
  const busyOwner = useRef(0);
  const loadingVersion = useRef(0);
  const speechBuffer = useRef("");
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushSpeech = useRef<() => void>(() => {});
  function cancelAnswer() {
    generation.current++;
    speechBuffer.current = "";
    if (speechTimer.current) clearTimeout(speechTimer.current);
    localAI.current?.stop();
    // Keep busy until the interrupted stream settles; the engine is sequential.
    setStreamed("");
  }
  function disableAI() {
    loadingVersion.current++;
    cancelAnswer();
    localAI.current?.dispose();
    localAI.current = null;
    busy.current = false;
    busyOwner.current = 0;
    setGenerating(false);
    setAIStatus("off");
    setAIError("");
  }
  async function enableAI() {
    const token = ++loadingVersion.current;
    setAIStatus("loading"); setAIError(""); setAIProgress("");
    const service = new LocalAI();
    localAI.current?.dispose(); localAI.current = service;
    try {
      await service.load(setAIProgress);
      if (token === loadingVersion.current) setAIStatus("ready");
    } catch (error) {
      if (token !== loadingVersion.current) return;
      service.dispose();
      setAIStatus("error");
      setAIError(error instanceof Error ? error.message : "The model could not load. Check WebGPU, available memory and network access.");
    }
  }
  const aiControls = <LocalAIControls status={aiStatus} progress={aiProgress} error={aiError} enable={enableAI} disable={disableAI} />;
  const [title, setTitle] = useState("New conversation");
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<"short" | "star" | "details">(
    state.settings.responseMode,
  );
  const [demoIndex, setDemoIndex] = useState(0);
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [demoSpeed, setDemoSpeed] = useState(1);
  const [micOn, setMicOn] = useState(false);
  const [screenState, setScreenState] = useState<
    "off" | "active" | "paused" | "ended" | "error"
  >("off");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenLabel, setScreenLabel] = useState("");
  const [snapshot, setSnapshot] = useState("");
  const [compact, setCompact] = useState(state.settings.compact);
  const addQuestionRef = useRef<(text: string, speaker?: string) => void>(
    () => {},
  );
  const shortcuts = useRef({ ask: () => {}, note: () => {}, memory: () => {} });
  const activeId = active?.id;
  const activeStatus = active?.status;
  const transcriptBox = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const screenProvider = useRef(browserScreenProvider());
  const speechProvider = useRef(browserSpeechProvider());
  const [showResume, setShowResume] = useState(true);
  useEffect(() => {
    if (!activeId || activeStatus !== "active") return;
    const timer = setInterval(() => {
      update((s) => ({
        ...s,
        sessions: s.sessions.map((x) =>
          x.id === activeId
            ? { ...x, durationSeconds: x.durationSeconds + 1 }
            : x,
        ),
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeId, activeStatus, update]);
  useEffect(() => {
    if (activeStatus !== "active") {
      speechProvider.current.stop();
      if (speechTimer.current) clearTimeout(speechTimer.current);
      speechBuffer.current = "";
      generation.current++;
      localAI.current?.stop();
      setStreamed("");
      setMicOn(false);
    }
  }, [activeStatus]);
  useEffect(() => {
    if (video.current) video.current.srcObject = stream;
  }, [stream, screenState]);
  useEffect(() => {
    if (state.settings.autoscroll && transcriptBox.current)
      transcriptBox.current.scrollTop = transcriptBox.current.scrollHeight;
  }, [active?.transcript.length, state.settings.autoscroll]);
  useEffect(
    () => () => {
      speechProvider.current.stop();
      screenProvider.current.stop();
      if (speechTimer.current) clearTimeout(speechTimer.current);
      generation.current++;
      loadingVersion.current++;
      localAI.current?.dispose();
      localAI.current = null;
    },
    [],
  );
  useEffect(() => {
    if (
      busy.current ||
      !demoPlaying ||
      !activeId ||
      activeStatus !== "active" ||
      demoIndex >= demoLines.length
    )
      return;
    const t = setTimeout(() => {
      addQuestionRef.current(demoLines[demoIndex], "Interviewer");
      setDemoIndex((i) => i + 1);
    }, 5500 / demoSpeed);
    return () => clearTimeout(t);
  }, [demoPlaying, demoIndex, activeId, activeStatus, demoSpeed, generating]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        shortcuts.current.ask();
        return;
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "m"
      ) {
        e.preventDefault();
        shortcuts.current.memory();
        return;
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "n"
      ) {
        e.preventDefault();
        shortcuts.current.note();
        return;
      }
      if (
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)
      )
        return;
      if (e.key === "1") setMode("short");
      if (e.key === "2") setMode("star");
      if (e.key === "3") setMode("details");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  function start() {
    const s = createSession(
      "live",
      title || "New conversation",
      state.prep[0]?.company,
      state.prep[0]?.role || state.user?.role,
    );
    update((a) => ({
      ...a,
      sessions: [s, ...a.sessions],
      activeSessionId: s.id,
    }));
    setShowResume(false);
    setDemoIndex(0);
  }
  async function addQuestion(text: string, speaker = "Interviewer") {
    if (!active || active.status !== "active" || !text.trim()) return;
    if (busy.current) { setQuestion(text); return; }
    const usingAI = aiStatus === "ready";
    const answer = usingAI ? null : mockAIProvider.answer(text, state, active);
    update((s) => ({
      ...s,
      sessions: s.sessions.map((x) =>
        x.id === active.id
          ? {
              ...x,
              transcript: [
                ...x.transcript,
                { id: uid(), at: now(), speaker, text: text.trim() },
              ],
              questions: [...x.questions, text.trim()],
              responses: answer ? [...x.responses, answer] : x.responses,
            }
          : x,
      ),
    }));
    setQuestion("");
    if (usingAI && localAI.current) {
      const token = ++generation.current;
      const sessionId = active.id;
      const watchdog = setTimeout(() => {
        if (busyOwner.current !== token || !localAI.current) return;
        disableAI();
        setAIError("Generation took over 90 seconds. The model was released; try a shorter question or use template guidance.");
      }, 90000);
      busyOwner.current = token;
      busy.current = true; setGenerating(true); setStreamed(""); setStreamQuestion(text); setAIError("");
      try {
        const result = await localAI.current.answer(answerMessages(text, state, active, mode), partial => {
          if (token === generation.current) setStreamed(partial);
        });
        if (token !== generation.current) return;
        const generated = { id: uid(), question: text, intent: "local-ai", short: result, star: result, details: result, talkingPoints: [], followUps: ["Explain your reasoning and give an example."], at: now(), pinned: false };
        update(s => ({ ...s, sessions: s.sessions.map(x => x.id === sessionId && x.status === "active" ? { ...x, responses: [...x.responses, generated] } : x) }));
      } catch (error) {
        if (token === generation.current) setAIError(error instanceof Error ? error.message : "Generation failed. Your question is saved; retry or turn off AI to use templates.");
      } finally {
        clearTimeout(watchdog);
        // A disposed service may never settle; disableAI also resets this state.
        if (busyOwner.current === token && localAI.current) {
          busy.current = false; setGenerating(false); setStreamed("");
          flushSpeech.current();
        }
      }
    }
    if (state.settings.sound) {
      try {
        const AudioContextClass = window.AudioContext;
        const ctx = new AudioContextClass();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = 520;
        gain.gain.value = 0.025;
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.08);
        oscillator.onended = () => ctx.close();
      } catch {}
    }
  }
  addQuestionRef.current = addQuestion;
  flushSpeech.current = () => {
    if (busy.current || !speechBuffer.current || activeStatus !== "active") return;
    const text = speechBuffer.current;
    speechBuffer.current = "";
    void addQuestionRef.current(text);
  };
  function receiveSpeech(text: string) {
    speechBuffer.current = `${speechBuffer.current} ${text}`.trim().slice(-3000);
    setQuestion(speechBuffer.current);
    if (speechTimer.current) clearTimeout(speechTimer.current);
    speechTimer.current = setTimeout(() => flushSpeech.current(), 1800);
  }
  function note(memory = false) {
    if (!active) return;
    const value = window.prompt(
      memory ? "What should CLYVO remember?" : "Add a session note",
    );
    if (!value?.trim()) return;
    if (memory) {
      const m: MemoryType = {
        id: uid(),
        title: value.slice(0, 60),
        content: value,
        type: "Custom",
        tags: [],
        createdAt: now(),
        updatedAt: now(),
        pinned: false,
      };
      update((s) => ({ ...s, memories: [m, ...s.memories] }));
    } else
      update((s) => ({
        ...s,
        sessions: s.sessions.map((x) =>
          x.id === active.id ? { ...x, notes: [...x.notes, value] } : x,
        ),
      }));
  }
  function end() {
    if (!active) return;
    cancelAnswer();
    const summary = `${active.title}: ${active.questions.length} questions captured. ${active.notes.length} notes saved.`;
    update((s) => ({
      ...s,
      sessions: s.sessions.map((x) =>
        x.id === active.id
          ? {
              ...x,
              status: "completed",
              endedAt: now(),
              summary,
              feedbackId: uid(),
            }
          : x,
      ),
      activeSessionId: null,
    }));
    speechProvider.current.stop();
    setMicOn(false);
    screenProvider.current.stop();
    setStream(null);
    setSnapshot("");
    setScreenState("off");
    setDemoPlaying(false);
  }
  async function toggleMic() {
    if (micOn) {
      if (speechTimer.current) clearTimeout(speechTimer.current);
      speechBuffer.current = "";
      speechProvider.current.stop();
      setMicOn(false);
      return;
    }
    if (!speechProvider.current.supported) {
      setError(
        "Speech recognition is unavailable. Use manual questions or a simulated conversation.",
      );
      return;
    }
    setMicOn(true);
    speechProvider.current.start(
      receiveSpeech,
      (err) => {
        setError(err);
        setMicOn(false);
      },
      () => setMicOn(false),
    );
  }
  async function startScreen() {
    try {
      const result = await screenProvider.current.start(() => {
        setStream(null);
        setSnapshot("");
        setScreenState("ended");
      });
      setStream(result);
      setScreenState("active");
    } catch (e) {
      setScreenState("error");
      setError(
        e instanceof Error ? e.message : "Screen permission was denied.",
      );
    }
  }
  shortcuts.current = {
    ask: () => {
      if (question.trim()) addQuestion(question);
    },
    note: () => note(false),
    memory: () => note(true),
  };
  const response = active?.responses.at(-1);
  if (!active)
    return (
      <>
        <SectionTitle
          title="CLYVO Live"
          subtitle="A focused workspace for important conversations."
        />
        {aiControls}
        <Card className="start-card">
          <ClyvoIndicator state="ready" />
          <h2>Start a conversation</h2>
          <p>
            Ask manually, use browser speech recognition, or play a simulated
            interview. Enable free local AI above for generated answers from your CV.
          </p>
          <Field label="Session title" value={title} onChange={setTitle} />
          <Button onClick={start}>
            Start Live <ArrowRight size={17} />
          </Button>
        </Card>
      </>
    );
  if (showResume)
    return (
      <>
        <SectionTitle
          title="Unfinished conversation"
          subtitle="Your previous session was saved automatically."
        />
        <Card className="start-card">
          <ClyvoIndicator state="paused" />
          <h2>{active.title}</h2>
          <p>
            {active.questions.length} questions and {active.notes.length} notes
            saved.
          </p>
          <div className="row">
            <Button onClick={() => setShowResume(false)}>
              Resume session <ArrowRight size={16} />
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm("Discard this unfinished session?"))
                  update((s) => ({
                    ...s,
                    sessions: s.sessions.filter((x) => x.id !== active.id),
                    activeSessionId: null,
                  }));
              }}
            >
              Discard session
            </Button>
          </div>
        </Card>
      </>
    );
  return (
    <>
      <div className="live-header">
        <div>
          <span className="eyebrow">
            <span className="dot" /> {active.status.toUpperCase()}
          </span>
          <h1>{active.title}</h1>
          <span className="muted">
            {Math.floor(active.durationSeconds / 60)
              .toString()
              .padStart(2, "0")}
            :{(active.durationSeconds % 60).toString().padStart(2, "0")} elapsed
          </span>
        </div>
        <div className="row">
          <Button
            variant="secondary"
            onClick={() =>
              update((s) => ({
                ...s,
                sessions: s.sessions.map((x) =>
                  x.id === active.id
                    ? {
                        ...x,
                        status: x.status === "active" ? "paused" : "active",
                      }
                    : x,
                ),
              }))
            }
          >
            {active.status === "active" ? (
              <Pause size={16} />
            ) : (
              <Play size={16} />
            )}{" "}
            {active.status === "active" ? "Pause" : "Resume"}
          </Button>
          <Button variant="danger" onClick={end}>
            <Square size={15} /> End session
          </Button>
        </div>
      </div>
      {aiControls}
      <div className={`live-grid ${compact ? "compact" : ""}`}>
        <Card className="live-panel">
          <div className="panel-title">
            <h3>Live transcript</h3>
            <span>{active.transcript.length} lines</span>
          </div>
          <div className="transcript-scroll" ref={transcriptBox}>
            {active.transcript.length ? (
              active.transcript.map((t) => (
                <div className="transcript" key={t.id}>
                  <small>
                    {t.speaker}{" "}
                    {state.settings.timestamps &&
                      `· ${new Date(t.at).toLocaleTimeString()}`}
                  </small>
                  <p>{t.text}</p>
                </div>
              ))
            ) : (
              <Empty
                title="Listening for context"
                copy="Enter a question or start the simulation."
              />
            )}
          </div>
          <div className="sim-controls">
            <span>SIMULATED CONVERSATION</span>
            <div className="row">
              <button
                onClick={() => setDemoPlaying((v) => !v)}
                disabled={generating || active.status !== "active"}
              >
                {demoPlaying ? <Pause size={16} /> : <Play size={16} />}{" "}
                {demoPlaying ? "Pause" : "Play"}
              </button>
              <button
                onClick={() => {
                  if (demoIndex < demoLines.length) {
                    addQuestion(demoLines[demoIndex]);
                    setDemoIndex((i) => i + 1);
                  }
                }}
                disabled={
                  generating || active.status !== "active" || demoIndex >= demoLines.length
                }
              >
                Next
              </button>
              <button
                onClick={() => {
                  setDemoPlaying(false);
                  setDemoIndex(0);
                }}
              >
                Reset
              </button>
              <select
                aria-label="Simulation speed"
                value={demoSpeed}
                onChange={(e) => setDemoSpeed(Number(e.target.value))}
              >
                <option value="1">1×</option>
                <option value="2">2×</option>
              </select>
            </div>
            <small>
              {demoIndex}/{demoLines.length} lines
            </small>
          </div>
        </Card>
        <Card className="live-panel answer-panel">
          <div className="panel-title">
            <h3>
              <ClyvoIndicator
                state={
                  active.status === "paused"
                    ? "paused"
                    : response
                      ? "ready"
                      : "idle"
                }
              />{" "}
              CLYVO suggests
            </h3>
            <span>{response?.intent === "local-ai" ? "AI DRAFT · VERIFY" : "TEMPLATE GUIDANCE"}</span>
          </div>
          <p className="small-text muted">Choose a format before asking. AI answers are drafts; format changes apply to the next question.</p>
          <div className="tabs" role="tablist">
            {(["short", "star", "details"] as const).map((m) => (
              <button
                role="tab"
                aria-selected={mode === m}
                className={mode === m ? "active" : ""}
                key={m}
                onClick={() => setMode(m)}
              >
                {m === "star" ? "STAR" : m[0].toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          {generating && <div className="answer-content" aria-busy="true">
            <small>GENERATING ON THIS DEVICE</small><h3>{streamQuestion}</h3>
            <p className="answer-text">{streamed || "Thinking…"}</p>
            <Button variant="secondary" onClick={cancelAnswer}>Stop answer</Button>
          </div>}
          {!generating && response ? (
            <div className="answer-content">
              <small>QUESTION · {response.intent.replaceAll("-", " ")}</small>
              <h3>{response.question}</h3>
              <p className="answer-text">{response[mode]}</p>
              <div className="answer-actions">
                <button
                  onClick={() => navigator.clipboard.writeText(response[mode])}
                >
                  <Copy size={15} /> Copy
                </button>
                <button onClick={() => note(false)}>
                  <FileText size={15} /> Save note
                </button>
                <button onClick={() => note(true)}>
                  <Brain size={15} /> Save memory
                </button>
                <button
                  onClick={() =>
                    update((s) => ({
                      ...s,
                      sessions: s.sessions.map((x) =>
                        x.id === active.id
                          ? {
                              ...x,
                              responses: x.responses.map((r) =>
                                r.id === response.id
                                  ? { ...r, pinned: !r.pinned }
                                  : r,
                              ),
                            }
                          : x,
                      ),
                    }))
                  }
                >
                  <Pin size={15} /> {response.pinned ? "Unpin" : "Pin"}
                </button>
                <button
                  onClick={() => addQuestion(response.followUps[0], "CLYVO")}
                >
                  Follow-up <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : !generating && (
            <Empty
              title="Ready when you are"
              copy="A concise suggestion will appear after a question is captured."
            />
          )}
          <form
            className="ask-form"
            onSubmit={(e) => {
              e.preventDefault();
              addQuestion(question);
            }}
          >
            <input
              aria-label="Ask CLYVO"
              placeholder="Type a question…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={active.status !== "active"}
            />
            <button
              className="button"
              type="submit"
              disabled={generating || !question.trim() || active.status !== "active"}
            >
              Ask <ArrowRight size={16} />
            </button>
          </form>
        </Card>
        <Card className="live-panel context-panel">
          <div className="panel-title">
            <h3>Context</h3>
            <span>PRIVATE</span>
          </div>
          <div className="context-content">
            <span className="eyebrow">PROFILE</span>
            <strong>{state.user?.role || "Add your role"}</strong>
            <p>
              {state.user?.resume ||
                "Add your experience during onboarding or in settings."}
            </p>
            <span className="eyebrow">SAVED MEMORY</span>
            <p>{state.memories.length} items available to local suggestions</p>
            <span className="eyebrow">AUDIO</span>
            <button className="outline-action" onClick={toggleMic}>
              {micOn ? <MicOff size={17} /> : <Mic size={17} />}{" "}
              {micOn ? "Stop recognition" : "Use microphone"}
            </button>
            <small>
              {speechProvider.current.supported
                ? "Browser speech recognition available"
                : "Manual and simulated input available"}
            </small>
            <p className="small-text muted">Recognized speech is grouped after a short pause, then answered automatically. While the model is busy, new speech waits for the next answer. Microphone mode hears nearby audio; it does not capture a meeting tab or headphones directly.</p>
            <p className="small-text muted">
              Speech may be processed by your browser’s speech service. Get
              participants’ permission before transcribing.
            </p>
            <span className="eyebrow">SCREEN CONTEXT</span>
            <button
              className="outline-action"
              onClick={() =>
                screenState === "active" || screenState === "paused"
                  ? (screenProvider.current.stop(),
                    setScreenState("off"),
                    setSnapshot(""),
                    setStream(null))
                  : startScreen()
              }
            >
              <Monitor size={17} />{" "}
              {screenState === "active" || screenState === "paused"
                ? "Stop sharing"
                : "Share screen"}
            </button>
            <small>
              Status: {screenState}. Screen content is not interpreted by AI.
            </small>
            {stream && (
              <>
                <video
                  ref={video}
                  autoPlay
                  muted
                  playsInline
                  className="screen-preview"
                />
                <div className="row">
                  <button
                    onClick={() => {
                      const next =
                        screenState === "paused" ? "active" : "paused";
                      stream
                        .getVideoTracks()
                        .forEach((t) => (t.enabled = next === "active"));
                      setScreenState(next);
                    }}
                  >
                    {screenState === "paused" ? "Resume" : "Pause"} context
                  </button>
                  <button
                    onClick={() => {
                      try {
                        if (video.current)
                          setSnapshot(
                            screenProvider.current.snapshot(video.current),
                          );
                      } catch (e) {
                        setError(
                          e instanceof Error
                            ? e.message
                            : "Snapshot unavailable.",
                        );
                      }
                    }}
                  >
                    Snapshot
                  </button>
                </div>
                <Field
                  label="Manual label"
                  value={screenLabel}
                  onChange={setScreenLabel}
                  placeholder="Describe what you see"
                />
                <small>{mockScreenInterpreter.describe(screenLabel)}</small>
              </>
            )}
            {snapshot && (
              <div>
                <p>Temporary snapshot</p>
                <Image
                  className="screen-preview"
                  src={snapshot}
                  alt="Screen snapshot"
                  width={640}
                  height={360}
                  unoptimized
                />
                <button onClick={() => setSnapshot("")}>Clear snapshot</button>
              </div>
            )}
            <button
              className="outline-action"
              onClick={() => setCompact((v) => !v)}
            >
              {compact ? "Full workspace" : "Compact mode"}
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
