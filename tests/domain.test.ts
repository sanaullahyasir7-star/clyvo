import test from "node:test";
import assert from "node:assert/strict";
import { sampleState, emptyState, State } from "../src/lib/model";
import {
  createStorage,
  exportState,
  parseImport,
  mergeStates,
} from "../src/providers/storage";
import { mockAIProvider, detectIntent } from "../src/providers/ai";
import { localSearchProvider } from "../src/providers/search";
class MemoryStorage implements Storage {
  values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(k: string) {
    return this.values.get(k) ?? null;
  }
  key(i: number) {
    return [...this.values.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.values.delete(k);
  }
  setItem(k: string, v: string) {
    this.values.set(k, v);
  }
}
test("sample data and export roundtrip are valid", () => {
  const state = sampleState();
  assert.ok(State.safeParse(state).success);
  assert.deepEqual(parseImport(JSON.stringify(exportState(state))), state);
});
test("malformed imports and unsupported versions are rejected", () => {
  assert.throws(() => parseImport("{"));
  assert.throws(() => parseImport('{"schemaVersion":999}'));
  assert.throws(() => parseImport('{"schemaVersion":1,"sessions":"bad"}'));
});
test("merge preserves existing sessions and deduplicates stable ids", () => {
  const state = sampleState();
  const merged = mergeStates(state, state);
  assert.equal(merged.sessions.length, state.sessions.length);
  assert.equal(merged.memories.length, state.memories.length);
});
test("persisted state survives reload and uses required keys", () => {
  const memory = new MemoryStorage();
  const provider = createStorage(memory);
  const state = sampleState();
  provider.save(state);
  assert.deepEqual(provider.load(), state);
  assert.ok(memory.getItem("clyvo:sessions"));
  assert.ok(memory.getItem("clyvo:meetings"));
  provider.clear();
  assert.equal(memory.length, 0);
});
test("legacy state migrates and corrupt content is backed up", () => {
  const memory = new MemoryStorage();
  memory.setItem("clyvo:state", JSON.stringify(sampleState()));
  assert.equal(createStorage(memory).load().user?.name, "Alex Morgan");
  memory.setItem("clyvo:state", "broken");
  assert.deepEqual(createStorage(memory).load(), emptyState);
  assert.equal(memory.getItem("clyvo:corrupt-backup"), "broken");
});
test("saved project context changes local responses", () => {
  const state = sampleState();
  state.memories[0].content = "Built a weather data pipeline";
  const answer = mockAIProvider.answer("Explain your project", state);
  assert.match(answer.short, /weather data pipeline/);
  assert.equal(detectIntent("Tell me about yourself"), "introduction");
  assert.equal(detectIntent("Explain the system design"), "system-design");
});
test("search includes transcript, note and meeting content", () => {
  const state = sampleState();
  assert.ok(
    localSearchProvider
      .query(state, "retrieval")
      .some((x) => x.type === "Transcript"),
  );
  assert.ok(
    localSearchProvider
      .query(state, "tradeoffs")
      .some((x) => x.type === "Note"),
  );
  assert.ok(
    localSearchProvider
      .query(state, "Friday")
      .some((x) => x.type === "Meeting"),
  );
});
