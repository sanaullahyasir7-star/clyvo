import test from "node:test";
import assert from "node:assert/strict";
import { browserScreenProvider } from "../src/providers/screen";
test("late screen permission is released after cancellation, and external end stops capture", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  let release!: (value: MediaStream) => void;
  const track = {
    onended: null as (() => void) | null,
    stops: 0,
    stop() {
      this.stops++;
    },
  };
  const stream = {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      mediaDevices: {
        getDisplayMedia: () =>
          new Promise<MediaStream>((resolve) => {
            release = resolve;
          }),
      },
    },
  });
  try {
    const provider = browserScreenProvider();
    let ended = 0;
    const pending = provider.start(() => ended++);
    provider.stop();
    release(stream);
    await assert.rejects(pending, /cancelled/);
    assert.equal(track.stops, 1);
    const active = provider.start(() => ended++);
    release(stream);
    await active;
    track.onended?.();
    assert.equal(ended, 1);
    assert.equal(track.stops, 2);
    assert.equal(track.onended, null);
    assert.throws(
      () =>
        provider.snapshot({
          videoWidth: 0,
          videoHeight: 0,
        } as HTMLVideoElement),
      /preview/,
    );
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "navigator", descriptor);
    else Reflect.deleteProperty(globalThis, "navigator");
  }
});
