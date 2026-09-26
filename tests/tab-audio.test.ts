import test from "node:test";
import assert from "node:assert/strict";
import { createTabAudioProvider, supportsTabSpeech, type TabAudioStatus } from "../src/providers/tab-audio";
import type { TranscriptionProvider } from "../src/providers/transcription";

function fixtures(hasAudio = true, surface = "browser") {
  const audio = { readyState: "live", stopped: false, onended: null as null | (() => void), stop() { this.stopped = true; } };
  const video = { ...audio, getSettings: () => ({ displaySurface: surface }) };
  const stream = { getTracks: () => hasAudio ? [audio, video] : [video], getAudioTracks: () => hasAudio ? [audio] : [], getVideoTracks: () => [video] } as unknown as MediaStream;
  let callbacks: Parameters<TranscriptionProvider["start"]> | undefined;
  const speech: TranscriptionProvider = { supported: true, start(...args) { callbacks = args; }, stop() {} };
  return { audio, video, stream, speech, callbacks: () => callbacks! };
}
test("tab speech support gate excludes browsers that may ignore audioTrack", () => {
  assert.equal(supportsTabSpeech("Mozilla Chrome/135.0 Safari/537.36"), true);
  for (const ua of ["Chrome/134.0", "Safari/605.1", "Chrome/150.0 Android", "Chrome/150.0 Edg/150.0", "CriOS/150 iPhone"])
    assert.equal(supportsTabSpeech(ua), false);
});
test("tab transcription uses the captured audio, waits for speech start, and stops all tracks", async () => {
  const f = fixtures();
  const statuses: TabAudioStatus[] = [], texts: string[] = [], errors: string[] = [];
  const provider = createTabAudioProvider({ capture: async () => f.stream, speech: f.speech, supported: true });
  await provider.start(t => texts.push(t), s => statuses.push(s), e => errors.push(e));
  assert.deepEqual(statuses, ["choosing", "connecting"]);
  assert.equal(f.callbacks()[3]?.audioTrack, f.audio);
  f.callbacks()[3]?.onStart?.();
  assert.equal(statuses.at(-1), "listening");
  f.callbacks()[0]("How would you test this?");
  assert.equal(texts.length, 1);
  f.video.onended?.();
  assert.equal(statuses.at(-1), "off");
  assert.ok(f.audio.stopped && f.video.stopped);
  f.callbacks()[0]("stale text");
  f.callbacks()[3]?.onStart?.();
  assert.equal(texts.length, 1);
  assert.equal(statuses.at(-1), "off");
  assert.deepEqual(errors, []);
});
test("missing audio and wrong source release capture and give useful errors", async () => {
  for (const [hasAudio, surface, pattern] of [[false, "browser", /No audio/], [true, "monitor", /Select a browser tab/]] as const) {
    const f = fixtures(hasAudio, surface), errors: string[] = [];
    const provider = createTabAudioProvider({ capture: async () => f.stream, speech: f.speech, supported: true });
    await provider.start(() => {}, () => {}, e => errors.push(e));
    assert.match(errors[0], pattern);
    assert.equal(f.video.stopped, true);
    assert.equal(f.callbacks(), undefined);
  }
});
test("cancelled picker cannot start transcription or leak a late stream", async () => {
  const f = fixtures();
  let resolve!: (stream: MediaStream) => void;
  const provider = createTabAudioProvider({ capture: () => new Promise(r => { resolve = r; }), speech: f.speech, supported: true });
  const states: TabAudioStatus[] = [];
  const pending = provider.start(() => {}, s => states.push(s), () => assert.fail("cancel is not an error"));
  provider.stop();
  resolve(f.stream);
  await pending;
  assert.ok(f.audio.stopped && f.video.stopped);
  assert.equal(f.callbacks(), undefined);
  assert.deepEqual(states, ["choosing"]);
});
test("speech failures release captured audio and never switch to microphone", async () => {
  const f = fixtures(), errors: string[] = [];
  const provider = createTabAudioProvider({ capture: async () => f.stream, speech: f.speech, supported: true });
  await provider.start(() => {}, () => {}, e => errors.push(e));
  f.callbacks()[1]("Speech recognition: network");
  assert.ok(f.audio.stopped && f.video.stopped);
  assert.deepEqual(errors, ["Speech recognition: network"]);
});
test("unsupported browser is rejected before the picker opens", async () => {
  const f = fixtures(), errors: string[] = [];
  const provider = createTabAudioProvider({ capture: async () => { assert.fail("must not capture"); }, speech: f.speech, supported: false });
  await provider.start(() => {}, () => {}, e => errors.push(e));
  assert.match(errors[0], /desktop Google Chrome/);
});
