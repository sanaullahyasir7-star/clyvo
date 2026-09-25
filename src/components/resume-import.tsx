"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Field } from "./ui";
import { extractResume, MAX_CV_CHARACTERS } from "@/providers/resume";
export function ResumeImport({ onApply }: { onApply: (text: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  return (
    <section className="resume-import" aria-label="Import CV">
      <label className="field">
        <span>Import CV (PDF or Word)</span>
        <input
          type="file"
          accept=".pdf,.docx,.doc,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const current = ++request.current;
            setBusy(true);
            setError("");
            setPreview(null);
            setName(file.name);
            try {
              const text = await extractResume(file, (m) => {
                if (current === request.current) setMessage(m);
              });
              if (current === request.current) {
                setPreview(text);
                setMessage(
                  "Review the text below. Your saved resume has not changed yet.",
                );
              }
            } catch (e) {
              if (current === request.current) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "Could not read this CV. Try another file.",
                );
                setMessage("");
              }
            } finally {
              if (current === request.current) setBusy(false);
            }
          }}
        />
      </label>
      <p className="small-text muted">
        PDF, Word .docx, TXT or MD · up to 10 MB. Extracted on this device. The
        original file is not uploaded or saved. Scanned PDFs need selectable
        text; older .doc files must be saved as .docx.
      </p>
      {message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      {preview !== null && (
        <div className="import-preview">
          <strong>{name}</strong>
          <Field
            label="Extracted CV text"
            multiline
            value={preview}
            onChange={setPreview}
          />
          <p className="small-text">
            Check names, dates, and reading order. Tables and columns may need
            editing. Only this text will be used for suggestions.
          </p>
          <div className="row">
            <Button
              disabled={!preview.trim() || preview.length > MAX_CV_CHARACTERS}
              onClick={() => {
                onApply(preview.trim());
                setPreview(null);
                setMessage(
                  "CV text applied to your resume. You can edit it below.",
                );
              }}
            >
              Use CV text
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setPreview(null);
                setMessage("");
              }}
            >
              Cancel import
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
