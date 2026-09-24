"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppState, emptyState } from "@/lib/model";
import { localStorageProvider } from "./storage";
interface AppContextValue {
  state: AppState;
  ready: boolean;
  update: (fn: (s: AppState) => AppState) => void;
  replace: (s: AppState) => void;
  clear: () => void;
  error: string;
  setError: (s: string) => void;
}
const Context = createContext<AppContextValue | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const update = useCallback(
    (fn: (s: AppState) => AppState) => setState((s) => fn(s)),
    [],
  );
  const clear = useCallback(() => {
    localStorageProvider.clear();
    setState(emptyState);
  }, []);
  useEffect(() => {
    setState(localStorageProvider.load());
    setReady(true);
    const handler = () =>
      setError(
        "Browser storage is full or unavailable. Export your data and free some space.",
      );
    const corrupt = () =>
      setError(
        "Some saved data could not be read. A recovery copy was kept in this browser. Import a valid export to restore your workspace.",
      );
    window.addEventListener("clyvo-storage-error", handler);
    window.addEventListener("clyvo-storage-corrupt", corrupt);
    return () => {
      window.removeEventListener("clyvo-storage-error", handler);
      window.removeEventListener("clyvo-storage-corrupt", corrupt);
    };
  }, []);
  useEffect(() => {
    if (ready) localStorageProvider.save(state);
  }, [state, ready]);
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
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error("AppProvider missing");
  return value;
}
