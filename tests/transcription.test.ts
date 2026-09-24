import test from "node:test";
import assert from "node:assert/strict";
import { browserSpeechProvider } from "../src/providers/transcription";

test("speech lifecycle ignores callbacks from replaced and stopped recordings", () => {
  const instances: FakeRecognition[] = [];
  class FakeRecognition {
    continuous = false;
    interimResults = false;
    onresult:
      | ((e: {
          results: { transcript: string }[][];
          resultIndex: number;
        }) => void)
      | null = null;
    onerror: ((e: { error: string }) => void) | null = null;
    onend: (() => void) | null = null;
    constructor() {
      instances.push(this);
    }
    start() {}
    stop() {
      this.onend?.();
    }
  }
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { SpeechRecognition: FakeRecognition },
  });
  try {
    const provider = browserSpeechProvider();
    const texts: string[] = [];
    const errors: string[] = [];
    let ended = 0;
    const start = () =>
      provider.start(
        (t) => texts.push(t),
        (e) => errors.push(e),
        () => ended++,
      );
    start();
    const oldResult = instances[0].onresult;
    const oldEnd = instances[0].onend;
    start();
    oldEnd?.();
    oldResult?.({ results: [[{ transcript: "stale" }]], resultIndex: 0 });
    assert.equal(ended, 0);
    assert.deepEqual(texts, []);
    instances[1].onresult?.({
      results: [[{ transcript: "current" }]],
      resultIndex: 0,
    });
    instances[1].onend?.();
    assert.equal(ended, 1);
    assert.deepEqual(texts, ["current"]);
    start();
    const delayedResult = instances[2].onresult;
    provider.stop();
    delayedResult?.({
      results: [[{ transcript: "after stop" }]],
      resultIndex: 0,
    });
    assert.deepEqual(texts, ["current"]);
    start();
    instances[3].onerror?.({ error: "not-allowed" });
    assert.match(errors[0], /not-allowed/);
    assert.equal(instances[3].onresult, null);
  } finally {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
