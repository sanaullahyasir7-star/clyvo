import {
  AppState,
  State,
  emptyState,
  CURRENT_SCHEMA_VERSION,
} from "@/lib/model";
export interface StorageProvider {
  load(): AppState;
  save(state: AppState): void;
  clear(): void;
}
export const storageKeys = {
  schemaVersion: "clyvo:schemaVersion",
  user: "clyvo:user",
  onboarding: "clyvo:onboarding",
  sessions: "clyvo:sessions",
  memories: "clyvo:memories",
  settings: "clyvo:settings",
  prep: "clyvo:prep",
  meetings: "clyvo:meetings",
  activeSessionId: "clyvo:activeSession",
} as const;
export function migrateState(value: unknown): AppState {
  const result = State.safeParse(value);
  if (!result.success)
    throw new Error("The saved data uses an unsupported or invalid schema.");
  return result.data;
}
export function createStorage(storage: Storage): StorageProvider {
  return {
    load() {
      try {
        const raw = storage.getItem("clyvo:state");
        if (raw) return migrateState(JSON.parse(raw));
        const version = storage.getItem(storageKeys.schemaVersion);
        if (!version) return structuredClone(emptyState);
        const data: Record<string, unknown> = {};
        for (const [key, name] of Object.entries(storageKeys)) {
          if (key === "meetings") continue;
          const raw = storage.getItem(name);
          data[key] =
            raw === null ? emptyState[key as keyof AppState] : JSON.parse(raw);
        }
        return migrateState(data);
      } catch {
        try {
          storage.setItem(
            "clyvo:corrupt-backup",
            storage.getItem("clyvo:state") ||
              JSON.stringify(
                Object.fromEntries(
                  Object.values(storageKeys).map((k) => [
                    k,
                    storage.getItem(k),
                  ]),
                ),
              ),
          );
        } catch {}
        if (typeof window !== "undefined")
          setTimeout(
            () => window.dispatchEvent(new Event("clyvo-storage-corrupt")),
            0,
          );
        return structuredClone(emptyState);
      }
    },
    save(state) {
      const valid = State.parse(state);
      const snapshot = JSON.stringify(valid);
      const previous = storage.getItem("clyvo:state");
      if (previous === snapshot) return;
      // Keep a valid prior snapshot. Backup failure must not prevent a primary save.
      if (previous) {
        try {
          migrateState(JSON.parse(previous));
          storage.setItem("clyvo:backup", previous);
        } catch {}
      }
      storage.setItem("clyvo:state", snapshot);
      for (const [key, name] of Object.entries(storageKeys)) {
        try {
          storage.setItem(
            name,
            JSON.stringify(
              key === "meetings"
                ? valid.sessions.filter((s) => s.type === "meeting")
                : valid[key as keyof AppState],
            ),
          );
        } catch {
          /* The complete snapshot above remains authoritative. */
        }
      }
    },
    clear() {
      for (const name of Object.values(storageKeys)) storage.removeItem(name);
      storage.removeItem("clyvo:state");
      storage.removeItem("clyvo:corrupt-backup");
      storage.removeItem("clyvo:backup");
    },
  };
}
export const localStorageProvider: StorageProvider = {
  load() {
    if (typeof window === "undefined") return structuredClone(emptyState);
    return createStorage(window.localStorage).load();
  },
  save(state) {
    if (typeof window === "undefined") return;
    try {
      createStorage(window.localStorage).save(state);
    } catch {
      window.dispatchEvent(new Event("clyvo-storage-error"));
    }
  },
  clear() {
    if (typeof window !== "undefined")
      createStorage(window.localStorage).clear();
  },
};
export function parseImport(raw: string): AppState {
  if (new TextEncoder().encode(raw).length > 5 * 1024 * 1024)
    throw new Error("Import files must be 5 MB or smaller.");
  const data = JSON.parse(raw);
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error("Expected a CLYVO export object.");
  if (data.schemaVersion !== CURRENT_SCHEMA_VERSION)
    throw new Error("Unsupported export version");
  return migrateState({ ...data, user: data.user ?? data.profile ?? null });
}
export function exportState(state: AppState) {
  const valid = State.parse(state);
  return {
    ...valid,
    profile: valid.user,
    meetings: valid.sessions.filter((s) => s.type === "meeting"),
    exportedAt: new Date().toISOString(),
  };
}
export function mergeStates(current: AppState, incoming: AppState): AppState {
  const merge = <T extends { id: string }>(a: T[], b: T[]) =>
    Array.from(new Map([...a, ...b].map((x) => [x.id, x])).values());
  return State.parse({
    ...current,
    user: incoming.user ?? current.user,
    onboarding: incoming.onboarding || current.onboarding,
    settings: incoming.settings,
    sessions: merge(current.sessions, incoming.sessions),
    memories: merge(current.memories, incoming.memories),
    prep: merge(current.prep, incoming.prep),
    activeSessionId: current.activeSessionId ?? incoming.activeSessionId,
  });
}

export class StorageConflictError extends Error {}
export function saveIfUnchanged(
  storage: Storage,
  state: AppState,
  expected: string | null,
) {
  if (storage.getItem("clyvo:state") !== expected)
    throw new StorageConflictError("Another tab changed this workspace.");
  createStorage(storage).save(state);
  return storage.getItem("clyvo:state");
}
export function readBackup(storage: Storage): AppState | null {
  try {
    const raw = storage.getItem("clyvo:backup");
    return raw ? migrateState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
