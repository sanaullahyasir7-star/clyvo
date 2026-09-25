import test from "node:test";
import assert from "node:assert/strict";
import { emptyState, sampleState, State } from "../src/lib/model";
import {
  createStorage,
  saveIfUnchanged,
  StorageConflictError,
  readBackup,
  parseImport,
} from "../src/providers/storage";
import { reviewAnswer, meetingNotes } from "../src/providers/review";
import { mockAIProvider } from "../src/providers/ai";
class Store implements Storage {
  values = new Map<string, string>();
  failPrimary = false;
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  key(i: number) {
    return [...this.values.keys()][i] || null;
  }
  getItem(k: string) {
    return this.values.get(k) ?? null;
  }
  removeItem(k: string) {
    this.values.delete(k);
  }
  setItem(k: string, v: string) {
    if (this.failPrimary && k === "clyvo:state")
      throw new DOMException("Full", "QuotaExceededError");
    this.values.set(k, v);
  }
}
test("stale tabs cannot overwrite another tab's saved work", () => {
  const store = new Store();
  const first = sampleState();
  const expected = saveIfUnchanged(store, first, null);
  const newer = { ...first, onboarding: false };
  saveIfUnchanged(store, newer, expected);
  assert.throws(
    () => saveIfUnchanged(store, first, expected),
    StorageConflictError,
  );
  assert.equal(createStorage(store).load().onboarding, false);
});
test("a failed primary save retains saved data and a recoverable snapshot", () => {
  const store = new Store();
  const first = sampleState();
  createStorage(store).save(first);
  store.failPrimary = true;
  assert.throws(() => createStorage(store).save(emptyState));
  assert.deepEqual(createStorage(store).load(), first);
  assert.deepEqual(readBackup(store), first);
});
test("backup preserves previous snapshot and clear removes it", () => {
  const store = new Store();
  createStorage(store).save(emptyState);
  createStorage(store).save(sampleState());
  assert.deepEqual(readBackup(store), emptyState);
  createStorage(store).clear();
  assert.equal(store.length, 0);
});
test("optional email and unfinished drafts roundtrip without losing text", () => {
  const state = sampleState();
  state.user!.email = "";
  state.sessions[0].draftAnswer = "An unfinished response";
  state.sessions[0].practiceQuestions = ["A fixed practice question"];
  assert.deepEqual(parseImport(JSON.stringify(state)), State.parse(state));
});
test("invalid and oversized imports fail safely", () => {
  for (const raw of [
    "null",
    "[]",
    "123",
    "{}",
    " ".repeat(5 * 1024 * 1024 + 1),
  ])
    assert.throws(() => parseImport(raw));
});
test("meeting summary only classifies explicit action and decision labels", () => {
  const result = meetingNotes([
    "Decision: Use the existing service",
    "Action: Alex to test by Friday",
    "No decision has been made",
    "We may need action later",
  ]);
  assert.deepEqual(result.decisions, ["Decision: Use the existing service"]);
  assert.deepEqual(result.actions, ["Action: Alex to test by Friday"]);
});
test("practice types use different relevant question banks", () => {
  const coding = mockAIProvider.prepare("Developer", "Acme", "Coding");
  const design = mockAIProvider.prepare("Developer", "Acme", "System Design");
  const hr = mockAIProvider.prepare("Developer", "Acme", "HR");
  assert.notDeepEqual(coding, design);
  assert.match(coding.join(" "), /algorithm/);
  assert.match(design.join(" "), /consistency/);
  assert.match(hr.join(" "), /availability/);
});
test("feedback responds to action, reasoning, and evidence without numeric grades", () => {
  const brief = reviewAnswer("I like projects.");
  const specific = reviewAnswer(
    "I built a service because requests were slow. I measured latency and observed a reduced wait time.",
  );
  assert.ok(brief.nextSteps.length > specific.nextSteps.length);
  assert.equal(specific.observations.length, 3);
  assert.match(brief.followUp, /personally/);
  assert.match(specific.followUp, /change/);
});
