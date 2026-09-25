"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, Upload } from "lucide-react";
import { useApp } from "@/providers/app";
import { AppState } from "@/lib/model";
import {
  parseImport,
  mergeStates,
  exportState,
  readBackup,
} from "@/providers/storage";
import { ResumeImport } from "@/components/resume-import";
import { AudioMonitor } from "@/components/audio";
import { Button, Card, SectionTitle, Field, download } from "@/components/ui";
export default function SettingsPage() {
  const { state, update, replace, clear, setError } = useApp();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [importText, setImportText] = useState("");
  const [preview, setPreview] = useState<AppState | null>(null);
  const [selectedFile, setSelectedFile] = useState("");
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  function setting(key: keyof AppState["settings"], value: boolean | string) {
    update((s) => ({ ...s, settings: { ...s.settings, [key]: value } }));
  }
  function exportData() {
    download(
      `clyvo-export-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(exportState(state), null, 2),
    );
    setMessage("Backup download requested. Keep the JSON file somewhere safe.");
  }
  return (
    <>
      <SectionTitle
        title="Settings"
        subtitle="Shape your workspace and control local data."
      />
      {message && <p role="status">{message}</p>}
      <div className="settings-grid">
        <Card>
          <h2>Profile</h2>
          <Field
            label="Name"
            value={state.user?.name || ""}
            onChange={(v) =>
              update((s) => ({
                ...s,
                user: s.user ? { ...s.user, name: v } : null,
              }))
            }
          />
          <Field
            label="Professional role"
            value={state.user?.role || ""}
            onChange={(v) =>
              update((s) => ({
                ...s,
                user: s.user ? { ...s.user, role: v } : null,
              }))
            }
          />
          <ResumeImport
            onApply={(resume) =>
              update((s) => ({
                ...s,
                user: s.user ? { ...s.user, resume } : null,
              }))
            }
          />
          <Field
            label="Resume summary"
            value={state.user?.resume || ""}
            onChange={(v) =>
              update((s) => ({
                ...s,
                user: s.user ? { ...s.user, resume: v } : null,
              }))
            }
            multiline
          />
          <Field
            label="Projects"
            value={state.user?.projects || ""}
            onChange={(v) =>
              update((s) => ({
                ...s,
                user: s.user ? { ...s.user, projects: v } : null,
              }))
            }
            multiline
          />
        </Card>
        <Card>
          <h2>Experience</h2>
          <AudioMonitor />
          {(
            [
              ["reducedMotion", "Reduced motion"],
              ["timestamps", "Transcript timestamps"],
              ["autoscroll", "Autoscroll"],
              ["compact", "Compact mode"],
              ["sound", "Sound"],
            ] as const
          ).map(([key, label]) => (
            <label className="switch-row" key={key}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={state.settings[key]}
                onChange={(e) => setting(key, e.target.checked)}
              />
            </label>
          ))}
          <label className="field">
            <span>Default response format</span>
            <select
              value={state.settings.responseMode}
              onChange={(e) => setting("responseMode", e.target.value)}
            >
              <option value="short">Short</option>
              <option value="star">STAR</option>
              <option value="details">Details</option>
            </select>
          </label>
          <p className="muted">
            Browser speech and screen sharing depend on device support and
            permission.
          </p>
        </Card>
        <Card>
          <h2>Export and import</h2>
          <p>
            Export your profile, sessions, memories, prep, and settings as JSON.
          </p>
          <Button variant="secondary" onClick={exportData}>
            <Download size={16} /> Export JSON
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const backup = readBackup(window.localStorage);
              if (!backup) {
                setMessage("No previous backup is available yet.");
                return;
              }
              setPreview(backup);
              setImportText(JSON.stringify(exportState(backup)));
              setSelectedFile("Previous local snapshot");
              setMode("replace");
            }}
          >
            Review previous backup
          </Button>
          <p className="small-text">
            A previous local snapshot is kept when space permits. It is not a
            cloud backup. Download JSON regularly, especially before clearing
            browser data.
          </p>
          <label className="field file-input">
            <span>Import JSON</span>
            <input
              type="file"
              accept="application/json,.json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSelectedFile(file.name);
                try {
                  if (file.size > 5 * 1024 * 1024)
                    throw new Error("File too large");
                  const raw = await file.text();
                  setImportText(raw);
                  setPreview(parseImport(raw));
                  setError("");
                } catch {
                  setPreview(null);
                  setError(
                    "Choose a valid CLYVO JSON export up to 5 MB. Your current data was not changed.",
                  );
                }
              }}
            />
          </label>
          {preview && (
            <div className="import-preview">
              <strong>{selectedFile}</strong>
              <p>
                {preview.sessions.length} sessions · {preview.memories.length}{" "}
                memories · {preview.prep.length} prep records
              </p>
              <label className="field">
                <span>Import mode</span>
                <select
                  value={mode}
                  onChange={(e) =>
                    setMode(e.target.value as "merge" | "replace")
                  }
                >
                  <option value="merge">Merge with current data</option>
                  <option value="replace">Replace current data</option>
                </select>
              </label>
              <Button
                onClick={() => {
                  if (!window.confirm(`Confirm ${mode} import?`)) return;
                  try {
                    const incoming = parseImport(importText);
                    replace(
                      mode === "merge"
                        ? mergeStates(state, incoming)
                        : { ...incoming, activeSessionId: null },
                    );
                    setMessage(
                      "Import applied. Check the saved status above before closing this tab.",
                    );
                    setPreview(null);
                    setImportText("");
                    setSelectedFile("");
                  } catch {
                    setError("Import failed validation. No data was changed.");
                  }
                }}
              >
                <Upload size={16} /> Confirm import
              </Button>
            </div>
          )}
        </Card>
        <Card>
          <h2>Privacy and data</h2>
          <p>
            Data is stored in this browser. It does not sync across devices.
            Export before clearing browser data.
          </p>
          <Button
            variant="danger"
            onClick={() => {
              if (
                window.confirm(
                  "Delete all CLYVO local data? This cannot be undone.",
                )
              ) {
                if (clear()) router.push("/auth");
              }
            }}
          >
            <Trash2 size={16} /> Clear all data
          </Button>
        </Card>
      </div>
    </>
  );
}
