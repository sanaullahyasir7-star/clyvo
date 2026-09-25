"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, emptyState } from "@/lib/model";
import {
  createStorage,
  migrateState,
  saveIfUnchanged,
  StorageConflictError,
  exportState,
  readBackup,
} from "./storage";
import { download } from "@/components/ui";
interface AppContextValue {
  state: AppState;
  ready: boolean;
  update: (fn: (s: AppState) => AppState) => void;
  replace: (s: AppState) => void;
  clear: () => boolean;
  error: string;
  setError: (s: string) => void;
  saveStatus: "saved" | "saving" | "error";
}
const Context = createContext<AppContextValue | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saving",
  );
  const [blocked, setBlocked] = useState("");
  const expected = useRef<string | null>(null);
  const canSave = useRef(false);
  const update = useCallback(
    (fn: (s: AppState) => AppState) => setState(fn),
    [],
  );
  const clear = useCallback(() => {
    try {
      createStorage(window.localStorage).clear();
      expected.current = null;
      canSave.current = true;
      setBlocked("");
      setState(structuredClone(emptyState));
      return true;
    } catch {
      setError(
        "Could not clear browser storage. Check your browser settings and try again.",
      );
      return false;
    }
  }, []);
  useEffect(() => {
    try {
      const storage = window.localStorage;
      expected.current = storage.getItem("clyvo:state");
      const loaded = createStorage(storage).load();
      setState(loaded);
      if (expected.current) {
        try {
          migrateState(JSON.parse(expected.current));
        } catch {
          setBlocked(
            "Saved data could not be read. Automatic saving is paused to protect it. Download the recovery file before resetting this workspace.",
          );
          setSaveStatus("error");
          setReady(true);
          return;
        }
      }
      canSave.current = true;
    } catch {
      setError(
        "Browser storage is unavailable. You can work here, but export your data before closing this page.",
      );
      setSaveStatus("error");
    }
    setReady(true);
  }, []);
  useEffect(() => {
    const changed = (e: StorageEvent) => {
      if (
        (e.key === "clyvo:state" || e.key === null) &&
        e.newValue !== expected.current
      ) {
        canSave.current = false;
        setSaveStatus("error");
        setBlocked(
          "Another tab changed this workspace. Saving is paused to prevent overwriting it. Export this tab if needed, then reload to use the latest saved data.",
        );
      }
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);
  useEffect(() => {
    if (!ready || !canSave.current) return;
    try {
      expected.current = saveIfUnchanged(
        window.localStorage,
        state,
        expected.current,
      );
      setSaveStatus("saved");
    } catch (e) {
      setSaveStatus("error");
      if (e instanceof StorageConflictError) {
        canSave.current = false;
        setBlocked(
          "Another tab changed this workspace. Export this tab if needed, then reload to avoid overwriting saved work.",
        );
      } else
        setError(
          "Your latest changes could not be saved. Export your workspace now, then free browser storage. Keep this tab open until you have a backup.",
        );
    }
  }, [state, ready]);
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (saveStatus === "error") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [saveStatus]);
  return (
    <Context.Provider
      value={{
        state,
        ready,
        update,
        replace: setState,
        clear,
        error,
        setError,
        saveStatus,
      }}
    >
      {blocked ? (
        <main className="center-page">
          <section className="card recovery-card" role="alert">
            <h1>Your workspace is protected</h1>
            <p>{blocked}</p>
            <div className="row">
              <button
                className="button"
                onClick={() =>
                  download(
                    "clyvo-tab-backup.json",
                    JSON.stringify(exportState(state), null, 2),
                  )
                }
              >
                Export this tab
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  try {
                    download(
                      "clyvo-recovery.json",
                      window.localStorage.getItem("clyvo:state") || "{}",
                    );
                  } catch {
                    setError("Browser storage cannot be read.");
                  }
                }}
              >
                Download saved data
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  canSave.current = false;
                  window.location.reload();
                }}
              >
                Reload workspace
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  const backup = readBackup(window.localStorage);
                  if (!backup) {
                    setError(
                      "No valid previous backup was found. Keep the recovery file before resetting.",
                    );
                    return;
                  }
                  if (
                    window.confirm(
                      "Restore the previous saved snapshot? Recent changes may be missing.",
                    )
                  ) {
                    expected.current =
                      window.localStorage.getItem("clyvo:state");
                    canSave.current = true;
                    setBlocked("");
                    setError("");
                    setState(backup);
                  }
                }}
              >
                Restore previous backup
              </button>
              <button
                className="button danger"
                onClick={() => {
                  if (
                    window.confirm(
                      "Reset this browser workspace? Export the recovery file first. This removes local data.",
                    )
                  )
                    clear();
                }}
              >
                Reset workspace
              </button>
            </div>
            {error && <p role="alert">{error}</p>}
          </section>
        </main>
      ) : (
        <>
          {saveStatus === "error" && (
            <div className="notice error" role="alert">
              Changes are not saved. Keep this tab open and{" "}
              <button
                onClick={() =>
                  download(
                    "clyvo-unsaved-backup.json",
                    JSON.stringify(exportState(state), null, 2),
                  )
                }
              >
                Export a backup
              </button>
            </div>
          )}
          {children}
        </>
      )}
    </Context.Provider>
  );
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error("AppProvider missing");
  return value;
}
