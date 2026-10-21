import { useEffect, useRef, useState } from "react";
import { type Store, storageKey } from "./data";
import { type DriveClient } from "./drive";
import { stagesKey } from "./workflow";
import {
  WorkspaceCloud,
  collectWorkspace,
  mergeWorkspaces,
  rememberedBase,
  same,
  saveRecovery,
  readRecovery,
  downloadWorkspace,
  SyncConflict,
  SYNC_BASE,
  WORKFLOW_CHANGED,
  WORKFLOW_RESTORED,
  type Workspace,
} from "./workspaceSync";

type State = {
  busy: boolean;
  message: string;
  conflict: boolean;
  lastSynced: string;
};
function commitLocal(next: Workspace, base: Workspace): Store {
  const { __stageWorkflows, ...store } = next;
  const values = new Map<string, string>([
    [storageKey, JSON.stringify(store)],
    [SYNC_BASE, JSON.stringify(base)],
    ...store.projects.map(
      (project) =>
        [
          stagesKey(project.id),
          JSON.stringify(__stageWorkflows[project.id] || {}),
        ] as [string, string],
    ),
  ]);
  const previous = new Map(
    [...values.keys()].map((key) => [key, localStorage.getItem(key)]),
  );
  try {
    for (const [key, value] of values)
      if (previous.get(key) !== value) localStorage.setItem(key, value);
  } catch (error) {
    for (const [key, value] of previous) {
      try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } catch {}
    }
    throw error;
  }
  return store;
}
export default function useWorkspaceSync(
  store: Store,
  setStore: (store: Store) => void,
  drive: DriveClient | null,
) {
  const current = useRef(store);
  current.current = store;
  const [initialBase] = useState(rememberedBase);
  const base = useRef<Workspace>(initialBase);
  const [recoveryAvailable, setRecoveryAvailable] = useState(() =>
    Boolean(readRecovery()),
  );
  const trigger = useRef<(mode?: "merge" | "local" | "remote") => void>(
    () => {},
  );
  const changed = useRef<() => void>(() => {});
  const [state, setState] = useState<State>({
    busy: false,
    message: "Connect Drive to sync notes and projects between devices.",
    conflict: false,
    lastSynced: "",
  });
  useEffect(() => {
    if (!drive) {
      setState({
        busy: false,
        message: "Connect Drive to sync notes and projects between devices.",
        conflict: false,
        lastSynced: "",
      });
      trigger.current = () => {};
      changed.current = () => {};
      return;
    }
    let active = true,
      running = false,
      again = false,
      paused = false;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const cloud = new WorkspaceCloud(drive);
    const queue = () => {
      if (!active || paused) return;
      if (same(collectWorkspace(current.current), base.current)) return;
      setState((value) => ({
        ...value,
        message: "Local changes waiting to sync…",
      }));
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => void run(), 3000);
    };
    const run = async (mode: "merge" | "local" | "remote" = "merge") => {
      if (!active || (paused && mode === "merge")) return;
      if (running) {
        again = true;
        return;
      }
      running = true;
      paused = false;
      if (debounce) clearTimeout(debounce);
      setState((value) => ({
        ...value,
        busy: true,
        conflict: false,
        message: "Syncing workspace with Drive…",
      }));
      try {
        const remote = await cloud.read(mode !== "merge");
        if (!active) return;
        const before = collectWorkspace(current.current);
        const merged =
          mode === "remote" && remote.workspace
            ? remote.workspace
            : mode === "local" || !remote.workspace
              ? before
              : mergeWorkspaces(base.current, before, remote.workspace);
        if (
          !remote.workspace ||
          !same(merged, remote.workspace) ||
          remote.files.length > 1
        )
          await cloud.write(merged, remote.files);
        if (!active) return;
        const latest = collectWorkspace(current.current);
        // Retain edits made while the Drive request was in flight; the next pass
        // uploads them against the version that has just been confirmed by Drive.
        const visible =
          mode === "merge" ? mergeWorkspaces(before, latest, merged) : merged;
        if (!same(visible, latest)) {
          saveRecovery(latest);
          setRecoveryAvailable(true);
        }
        const updated = commitLocal(visible, merged);
        base.current = merged;
        if (!same(visible, latest)) {
          current.current = updated;
          setStore(updated);
          window.dispatchEvent(new Event(WORKFLOW_RESTORED));
        }
        const pending = !same(visible, merged);
        setState({
          busy: false,
          conflict: false,
          message: pending
            ? "Local changes waiting to sync…"
            : "Workspace saved to Drive",
          lastSynced: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
        if (pending) again = true;
      } catch (error) {
        if (active) {
          paused = error instanceof SyncConflict;
          setState((value) => ({
            ...value,
            busy: false,
            conflict: paused,
            message:
              error instanceof Error
                ? error.message
                : "Sync failed. Your browser copy is retained.",
          }));
        }
      } finally {
        running = false;
        if (active && again && !paused) {
          again = false;
          debounce = setTimeout(() => void run(), 3000);
        }
      }
    };
    trigger.current = (mode) => {
      paused = false;
      void run(mode);
    };
    changed.current = queue;
    const wake = () => {
      if (document.visibilityState === "visible") void run();
    };
    const storage = (event: StorageEvent) => {
      if (
        event.key === storageKey ||
        event.key?.startsWith("researchos-stages-")
      ) {
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw) as Store;
            collectWorkspace(parsed);
            current.current = parsed;
            setStore(parsed);
            window.dispatchEvent(new Event(WORKFLOW_RESTORED));
            queue();
          }
        } catch {}
      }
    };
    window.addEventListener(WORKFLOW_CHANGED, queue);
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("storage", storage);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void run();
    }, 30000);
    void run();
    return () => {
      active = false;
      if (debounce) clearTimeout(debounce);
      clearInterval(interval);
      window.removeEventListener(WORKFLOW_CHANGED, queue);
      window.removeEventListener("focus", wake);
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("storage", storage);
    };
  }, [drive, setStore]);
  useEffect(() => {
    changed.current();
  }, [store]);
  return {
    ...state,
    recoveryAvailable,
    connected: Boolean(drive),
    syncNow: () => trigger.current(),
    loadDrive: () => {
      if (
        confirm(
          "Load the latest Drive workspace? A recovery copy of this browser workspace will be kept.",
        )
      )
        trigger.current("remote");
    },
    keepLocal: () => {
      if (
        confirm(
          "Use this browser workspace on your connected devices? Previous Drive snapshots remain available for recovery.",
        )
      )
        trigger.current("local");
    },
    downloadRecovery: () => {
      const saved = readRecovery();
      if (saved) downloadWorkspace(saved);
    },
  };
}
