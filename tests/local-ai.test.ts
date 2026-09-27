import test from "node:test";
import assert from "node:assert/strict";
import { answerMessages, LocalAI, LOCAL_MODEL } from "../src/providers/local-ai";
import { prebuiltAppConfig } from "@mlc-ai/web-llm";
import { emptyState } from "../src/lib/model";
test("local model exists in the installed runtime catalog", () => {
  assert.ok(prebuiltAppConfig.model_list.some(m => m.model_id === LOCAL_MODEL));
});
test("AI prompt uses bounded CV context and prohibits invented experience", () => {
  const state = structuredClone(emptyState);
  const messages = answerMessages("Explain a hash table", state, undefined, "star");
  assert.match(messages[0].content, /Never invent/);
  assert.match(messages[0].content, /Situation, Task, Action, Result/);
  assert.match(messages[1].content, /Explain a hash table/);
  assert.ok(answerMessages("x".repeat(10000), state)[1].content.length < 2000);
});
test("unsupported devices fail before downloading a model", async () => {
  const ai = new LocalAI();
  await assert.rejects(ai.load(() => {}), /WebGPU/);
  ai.dispose();
});

test("answer streams partial text and returns the final completion", async () => {
  const partials: string[] = [];
  const engine = { chat: { completions: { create: async () => (async function* () {
    yield { choices: [{ delta: { content: "First " } }] };
    yield { choices: [{ delta: { content: "answer" } }] };
  })() } } };
  const ai = new LocalAI(engine as unknown as import("@mlc-ai/web-llm").WebWorkerMLCEngine);
  assert.equal(await ai.answer(answerMessages("Question", emptyState), text => partials.push(text)), "First answer");
  assert.deepEqual(partials, ["First ", "First answer"]);
});
test("disposed generation never emits another chunk", async () => {
  const engine = { chat: { completions: { create: async () => (async function* () {
    ai.dispose();
    yield { choices: [{ delta: { content: "late" } }] };
  })() } } };
  const ai = new LocalAI(engine as unknown as import("@mlc-ai/web-llm").WebWorkerMLCEngine);
  await assert.rejects(ai.answer(answerMessages("Question", emptyState), () => assert.fail("Late output")), /cancelled/);
});
test("empty model output is a visible error", async () => {
  const engine = { chat: { completions: { create: async () => (async function* () {
    yield { choices: [] };
  })() } } };
  const ai = new LocalAI(engine as unknown as import("@mlc-ai/web-llm").WebWorkerMLCEngine);
  await assert.rejects(ai.answer(answerMessages("Question", emptyState), () => {}), /no answer/);
});
