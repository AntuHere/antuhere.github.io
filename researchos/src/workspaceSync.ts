import { parseBackup } from "./storage";
import { seed, type Store } from "./data";
import { loadStages, type WorkflowData } from "./workflow";
import type { DriveClient, DriveFile } from "./drive";

export type Workspace = Store & {
  __stageWorkflows: Record<string, WorkflowData>;
};
export const WORKFLOW_CHANGED = "researchos-workflow-changed";
export const WORKFLOW_RESTORED = "researchos-workflow-restored";
export const SYNC_BASE = "researchos-sync-base-v1";
export const SYNC_RECOVERY = "researchos-sync-recovery-v1";
export function parseWorkspace(raw: string): Workspace {
  const { store, workflows } = parseBackup(raw);
  return { ...store, __stageWorkflows: workflows };
}
export function collectWorkspace(store: Store): Workspace {
  return parseWorkspace(
    JSON.stringify({
      ...store,
      __stageWorkflows: Object.fromEntries(
        store.projects.map((p) => [p.id, loadStages(p.id)]),
      ),
    }),
  );
}
export function initialWorkspace(): Workspace {
  return {
    ...structuredClone(seed),
    __stageWorkflows: Object.fromEntries(seed.projects.map((p) => [p.id, {}])),
  };
}
function canonical(value: any): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical(value[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(value) ?? "undefined";
}
export const same = (a: any, b: any) => canonical(a) === canonical(b);
const missing = Symbol("missing");
export class SyncConflict extends Error {
  constructor() {
    super(
      "Another device changed the same item. Sync is paused so neither copy is silently overwritten.",
    );
  }
}
function mergeValue(base: any, local: any, remote: any): any {
  if (same(local, remote) || same(remote, base)) return local;
  if (same(local, base)) return remote;
  const isRecord = (x: any) =>
    x && typeof x === "object" && !Array.isArray(x) && x !== missing;
  if (
    isRecord(local) &&
    isRecord(remote) &&
    (base === missing || isRecord(base))
  ) {
    const result: Record<string, any> = Object.create(null);
    for (const key of new Set([
      ...Object.keys(base === missing ? {} : base),
      ...Object.keys(local),
      ...Object.keys(remote),
    ])) {
      const value = mergeValue(
        base !== missing && Object.prototype.hasOwnProperty.call(base, key)
          ? base[key]
          : missing,
        Object.prototype.hasOwnProperty.call(local, key) ? local[key] : missing,
        Object.prototype.hasOwnProperty.call(remote, key)
          ? remote[key]
          : missing,
      );
      if (value !== missing) result[key] = value;
    }
    return result;
  }
  const keyed = (x: any) =>
    Array.isArray(x) &&
    x.every((v) => v && typeof v === "object" && typeof v.id === "string");
  if (keyed(local) && keyed(remote) && (base === missing || keyed(base))) {
    const map = (array: any[]) =>
      Object.fromEntries(array.map((v) => [v.id, v]));
    const result = mergeValue(
      base === missing ? {} : map(base),
      map(local),
      map(remote),
    );
    return Object.values(result);
  }
  throw new SyncConflict();
}
export function mergeWorkspaces(
  base: Workspace,
  local: Workspace,
  remote: Workspace,
): Workspace {
  try {
    return parseWorkspace(JSON.stringify(mergeValue(base, local, remote)));
  } catch (error) {
    if (error instanceof SyncConflict) throw error;
    throw new SyncConflict();
  }
}
export function rememberedBase(): Workspace {
  try {
    return parseWorkspace(localStorage.getItem(SYNC_BASE) || "");
  } catch {
    return initialWorkspace();
  }
}
export function saveRecovery(workspace: Workspace) {
  localStorage.setItem(SYNC_RECOVERY, JSON.stringify(workspace));
}
export function downloadWorkspace(
  workspace: Workspace,
  name = "researchos-recovery.json",
) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(workspace, null, 2)], {
      type: "application/json",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function readRecovery(): Workspace | null {
  try {
    return parseWorkspace(localStorage.getItem(SYNC_RECOVERY) || "");
  } catch {
    return null;
  }
}

type Version = {
  format: 1;
  commitId: string;
  parents: string[];
  workspace: Workspace;
};
function parentsOf(file: DriveFile): string[] {
  return Object.entries(file.appProperties || {})
    .filter(([key]) => /^syncParents\d+$/.test(key))
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([, value]) => value.split(",").filter(Boolean));
}
export class WorkspaceCloud {
  constructor(private drive: DriveClient) {}
  private async version(file: DriveFile): Promise<Version> {
    const blob = await this.drive.download(file.id);
    if (blob.size > 10 * 1024 * 1024)
      throw Error("The Drive workspace is too large to load safely.");
    const value = JSON.parse(await blob.text());
    if (
      value.format !== 1 ||
      value.commitId !== file.appProperties?.syncId ||
      !Array.isArray(value.parents) ||
      !same([...value.parents].sort(), parentsOf(file).sort())
    )
      throw Error(
        "The Drive workspace snapshot is invalid. Your browser copy is unchanged.",
      );
    return {
      ...value,
      workspace: parseWorkspace(JSON.stringify(value.workspace)),
    };
  }
  async read(preferLatest = false) {
    const files = await this.drive.workspaceVersions();
    if (
      files.some(
        (file) =>
          !file.appProperties?.syncId ||
          !/^[a-f0-9]{32}$/.test(file.appProperties.syncId),
      ) ||
      new Set(files.map((file) => file.appProperties?.syncId)).size !==
        files.length
    )
      throw Error(
        "The Drive workspace history is invalid. Your browser copy is unchanged.",
      );
    const entries = new Map(
      files.map((file) => [file.appProperties!.syncId, file]),
    );
    const referenced = new Set(files.flatMap(parentsOf));
    const heads = files.filter(
      (file) => !referenced.has(file.appProperties!.syncId),
    );
    if (files.length && !heads.length)
      throw Error("The Drive workspace history is invalid.");
    if (!heads.length)
      return { files: heads, workspace: null as Workspace | null };
    if (preferLatest) {
      const latest = [...heads].sort(
        (a, b) =>
          (b.createdTime || "").localeCompare(a.createdTime || "") ||
          b.id.localeCompare(a.id),
      )[0];
      return {
        files: heads,
        workspace: (await this.version(latest)).workspace,
      };
    }
    const versions = await Promise.all(heads.map((file) => this.version(file)));
    if (versions.length === 1)
      return { files: heads, workspace: versions[0].workspace };
    const ancestors = (id: string) => {
      const result = new Set<string>();
      const pending = [id];
      while (pending.length) {
        const current = pending.pop()!;
        if (result.has(current)) continue;
        result.add(current);
        const entry = entries.get(current);
        if (!entry)
          throw Error(
            "A Drive workspace snapshot is missing. Your browser copy is unchanged.",
          );
        pending.push(...parentsOf(entry));
      }
      return result;
    };
    const ancestry = heads.map((file) => ancestors(file.appProperties!.syncId));
    const common = [...ancestry[0]]
      .filter((id) => ancestry.every((set) => set.has(id)))
      .map((id) => entries.get(id)!);
    // Server creation time orders ancestors along a branch; concurrent snapshots
    // are merged against a shared ancestor instead of overwriting each other.
    common.sort((a, b) =>
      (b.createdTime || "").localeCompare(a.createdTime || ""),
    );
    const base = common[0]
      ? (await this.version(common[0])).workspace
      : initialWorkspace();
    let combined = versions[0].workspace;
    for (const version of versions.slice(1))
      combined = mergeWorkspaces(base, combined, version.workspace);
    return { files: heads, workspace: combined };
  }
  async write(workspace: Workspace, heads: DriveFile[]) {
    const commitId = crypto.randomUUID().replace(/-/g, "");
    const parents = heads.map((file) => file.appProperties!.syncId);
    const properties: Record<string, string> = {
      researchosWorkspace: "v1",
      syncId: commitId,
    };
    for (let i = 0; i < parents.length; i += 3)
      properties["syncParents" + i / 3] = parents.slice(i, i + 3).join(",");
    await this.drive.createWorkspaceVersion(
      JSON.stringify({ format: 1, commitId, parents, workspace }),
      properties,
    );
  }
}
