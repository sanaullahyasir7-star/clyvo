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
