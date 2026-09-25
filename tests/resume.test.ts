import test from "node:test";
import assert from "node:assert/strict";
import fixtures from "./fixtures/cv.json";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import {
  cleanResumeText,
  validateResumeFile,
  extractResume,
} from "../src/providers/resume";

test("CV validation rejects empty, oversized, unsupported, and legacy Word files", () => {
  for (const file of [
    { name: "cv.pdf", size: 0 },
    { name: "cv.pdf", size: 11 * 1024 * 1024 },
    { name: "cv.exe", size: 10 },
    { name: "cv.doc", size: 10 },
  ])
    assert.throws(() => validateResumeFile(file));
  assert.equal(validateResumeFile({ name: "CV.DOCX", size: 10 }), "docx");
  assert.throws(() => cleanResumeText(" \n "), /No readable text/);
});
test("Word CV extraction preserves actual document text", async () => {
  const file = new File([Buffer.from(fixtures.docx, "base64")], "cv.docx");
  const result = await extractResume(file);
  assert.match(result, /Alex Example/);
  assert.match(result, /tested retrieval quality/);
});
test("PDF CV extraction reads a real PDF document", async () => {
  const { DOMMatrix } = await import("@napi-rs/canvas");
  const previous = Object.getOwnPropertyDescriptor(globalThis, "DOMMatrix");
  Object.defineProperty(globalThis, "DOMMatrix", {
    configurable: true,
    value: DOMMatrix,
  });
  try {
    const result = await extractResume(
      new File([Buffer.from(fixtures.pdf, "base64")], "cv.pdf"),
      () => {},
      pathToFileURL(
        resolve("node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"),
      ).href,
    );
    assert.match(result, /Alex Example/);
    assert.match(result, /tested retrieval quality/);
  } finally {
    if (previous) Object.defineProperty(globalThis, "DOMMatrix", previous);
    else Reflect.deleteProperty(globalThis, "DOMMatrix");
  }
});
test("invalid PDF and Word bytes do not replace resume content", async () => {
  await assert.rejects(
    extractResume(new File(["bad"], "cv.pdf")),
    /does not appear/,
  );
  await assert.rejects(
    extractResume(new File(["bad"], "cv.docx")),
    /not a readable/,
  );
});
