import test from "node:test";
import assert from "node:assert/strict";
import { sampleState } from "../src/lib/model";
import { answerMessages } from "../src/providers/local-ai";
import {
  exportState,
  parseImport,
  createStorage,
} from "../src/providers/storage";
import { MicrophoneLease } from "../src/providers/audio-monitor";
import { validateDocxArchive } from "../src/providers/docx-budget";

test("a question retrieves relevant experience beyond the CV prefix", () => {
  const s = sampleState();
  s.user!.resume =
    "Unrelated work. ".repeat(400) +
    "I built a zirconium telemetry service with checked calibration.";
  assert.match(
    answerMessages("Describe your zirconium telemetry experience", s)[1]
      .content,
    /zirconium telemetry service/,
  );
});
test("selected preparation and a relevant pinned fourth memory reach the prompt", () => {
  const s = sampleState();
  const session = s.sessions[0];
  session.prepContext = {
    id: "selected",
    jobDescription: "Operate basalt sensors",
    companyContext: "Basalt research",
    projects: "Basalt monitoring",
  };
  s.memories.push(
    { ...s.memories[0], id: "third", content: "Other" },
    {
      ...s.memories[0],
      id: "fourth",
      pinned: true,
      content: "I calibrated basalt sensors.",
    },
  );
  const prompt = answerMessages(
    "Explain your basalt sensors experience",
    s,
    session,
  )[1].content;
  assert.match(prompt, /Operate basalt sensors/);
  assert.match(prompt, /I calibrated basalt sensors/);
});
test("oversized multilingual fields stay within the conservative inference budget", () => {
  const s = sampleState();
  s.user!.role = "界".repeat(100000);
  s.user!.resume = "界".repeat(100000);
  const messages = answerMessages("界".repeat(10000), s);
  assert.ok(
    new TextEncoder().encode(messages.map((m) => m.content).join("\n"))
      .length <= 3400,
  );
});
test("large backup roundtrips without duplicate profile data", () => {
  const s = sampleState();
  s.user!.resume = "x".repeat(2700000);
  const exported = exportState(s);
  assert.equal("profile" in exported, false);
  assert.deepEqual(parseImport(JSON.stringify(exported, null, 2)), s);
});
test("pending questions and selected preparation survive backup restoration", () => {
  const s = sampleState();
  s.sessions[0].pendingQuestions = [
    { id: "q1", text: "First?", speaker: "Remote", at: "2026-09-27" },
    { id: "q2", text: "Second?", speaker: "Remote", at: "2026-09-27" },
  ];
  s.activeSessionId = s.sessions[0].id;
  s.sessions[0].status = "paused";
  assert.deepEqual(parseImport(JSON.stringify(exportState(s))), s);
});
test("saving changed canonical state writes only primary and backup", () => {
  const map = new Map<string, string>();
  let writes = 0;
  const storage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      writes++;
      map.set(k, v);
    },
    removeItem: (k: string) => map.delete(k),
  } as unknown as Storage;
  const s = sampleState();
  const provider = createStorage(storage);
  provider.save(s);
  writes = 0;
  s.sessions[0].durationSeconds++;
  provider.save(s);
  assert.equal(writes, 2);
});
test("microphone permission resolving after stop releases the late stream", async () => {
  const lease = new MicrophoneLease();
  let release!: (s: MediaStream) => void,
    stops = 0;
  const pending = lease.acquire(() => new Promise((r) => (release = r)));
  lease.stop();
  release({
    getTracks: () => [{ stop: () => stops++ }],
  } as unknown as MediaStream);
  assert.equal(await pending, null);
  assert.equal(stops, 1);
});
test("overlapping microphone acquisition retains only the newest stream", async () => {
  const lease = new MicrophoneLease();
  let first!: (s: MediaStream) => void,
    stops = 0;
  const stream = () =>
    ({ getTracks: () => [{ stop: () => stops++ }] }) as unknown as MediaStream;
  const a = lease.acquire(() => new Promise((r) => (first = r)));
  const b = await lease.acquire(async () => stream());
  first(stream());
  assert.equal(await a, null);
  assert.ok(b);
  lease.stop();
  assert.equal(stops, 2);
});
test("DOCX expansion budget rejects excessive declared uncompressed data", () => {
  const b = new ArrayBuffer(68),
    v = new DataView(b);
  v.setUint32(0, 0x02014b50, true);
  v.setUint32(24, 26 * 1024 * 1024, true);
  v.setUint32(46, 0x06054b50, true);
  v.setUint16(56, 1, true);
  assert.throws(() => validateDocxArchive(b), /25 MB/);
});
