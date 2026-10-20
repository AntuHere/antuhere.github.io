import { type Store } from "./data";

import type { WorkflowStage as Stage } from "./workflow";
type Workflows = Record<string, Record<string, Stage>>;
const fields: Record<keyof Store, string[]> = {
  projects: [
    "id",
    "name",
    "short",
    "description",
    "status",
    "phase",
    "color",
    "icon",
    "updated",
    "deadline",
    "visibility",
    "goal",
  ],
  tasks: ["id", "projectId", "title", "status", "priority", "due", "assignee"],
  papers: [
    "id",
    "projectId",
    "title",
    "authors",
    "year",
    "doi",
    "status",
    "notes",
    "url",
  ],
  assets: ["id", "projectId", "name", "kind", "url", "updated"],
  notes: ["id", "projectId", "title", "body", "updated"],
  members: ["id", "projectId", "email", "role", "status"],
};

export function parseBackup(text: string): {
  store: Store;
  workflows: Workflows;
} {
  const value = JSON.parse(text);
  if (!value || typeof value !== "object") throw Error("Invalid backup");
  const store = {} as Store;
  for (const key of Object.keys(fields) as (keyof Store)[]) {
    const rows = value[key];
    if (!Array.isArray(rows)) throw Error("Missing records");
    const ids = new Set();
    for (const row of rows) {
      if (
        !row ||
        fields[key].some((field) => typeof row[field] !== "string") ||
        !row.id ||
        ids.has(row.id)
      )
        throw Error("Invalid record");
      if (
        key === "papers" &&
        ["abstractSummary", "gap", "methods", "findings", "relevance"].some(
          (field) => row[field] !== undefined && typeof row[field] !== "string",
        )
      )
        throw Error("Invalid paper fields");
      if (
        key === "notes" &&
        ((row.pinned !== undefined && typeof row.pinned !== "boolean") ||
          (row.color !== undefined &&
            !["yellow", "mint", "pink", "violet"].includes(row.color)))
      )
        throw Error("Invalid note fields");
      ids.add(row.id);
      if (
        key === "projects" &&
        (!Number.isFinite(row.progress) ||
          row.progress < 0 ||
          row.progress > 100 ||
          !Number.isFinite(row.members))
      )
        throw Error("Invalid project");
    }
    store[key] = rows;
  }
  const projectIds = new Set(store.projects.map((p) => p.id));
  for (const key of [
    "tasks",
    "papers",
    "assets",
    "notes",
    "members",
  ] as const) {
    if (store[key].some((row) => !projectIds.has(row.projectId)))
      throw Error("Unknown project");
  }
  const workflows: Workflows = Object.create(null);
  const raw = value.__stageWorkflows ?? {};
  if (!raw || Array.isArray(raw) || typeof raw !== "object")
    throw Error("Invalid workflows");
  for (const [id, workflow] of Object.entries(raw)) {
    if (
      !projectIds.has(id) ||
      !workflow ||
      Array.isArray(workflow) ||
      typeof workflow !== "object"
    )
      throw Error("Invalid workflow");
    for (const [index, stage] of Object.entries(workflow)) {
      const s = stage as Stage;
      if (
        !/^[0-8]$/.test(index) ||
        !s ||
        !Array.isArray(s.checked) ||
        s.checked.length !== 4 ||
        s.checked.some((v) => typeof v !== "boolean") ||
        typeof s.notes !== "string" ||
        !["Not started", "In progress", "Complete"].includes(s.status)
      )
        throw Error("Invalid stage");
      if (s.todos !== undefined) {
        if (
          !Array.isArray(s.todos) ||
          s.todos.some(
            (todo) =>
              !todo ||
              typeof todo.id !== "string" ||
              !todo.id ||
              typeof todo.title !== "string" ||
              typeof todo.done !== "boolean",
          ) ||
          new Set(s.todos.map((todo) => todo.id)).size !== s.todos.length
        )
          throw Error("Invalid stage to-do list");
      }
      if (s.stickyNotes !== undefined) {
        if (
          !Array.isArray(s.stickyNotes) ||
          s.stickyNotes.some(
            (note) =>
              !note ||
              fields.notes.some(
                (field) => typeof (note as any)[field] !== "string",
              ) ||
              !note.id ||
              note.projectId !== id ||
              (note.pinned !== undefined && typeof note.pinned !== "boolean") ||
              (note.color !== undefined &&
                !["yellow", "mint", "pink", "violet"].includes(note.color)),
          ) ||
          new Set(s.stickyNotes.map((note) => note.id)).size !==
            s.stickyNotes.length
        )
          throw Error("Invalid stage sticky notes");
      }
    }
    workflows[id] = workflow as Record<string, Stage>;
  }
  return { store, workflows };
}

export function replaceWorkflows(ids: string[], workflows: Workflows) {
  // Roll back partial writes if the browser refuses storage during an import.
  const previous = ids.map(
    (id) => [id, localStorage.getItem("researchos-stages-" + id)] as const,
  );
  try {
    for (const id of ids) {
      localStorage.setItem(
        "researchos-stages-" + id,
        JSON.stringify(workflows[id] || {}),
      );
    }
  } catch (error) {
    for (const [id, raw] of previous) {
      if (raw === null) localStorage.removeItem("researchos-stages-" + id);
      else localStorage.setItem("researchos-stages-" + id, raw);
    }
    throw error;
  }
}

export function clearWorkflows(ids: string[]) {
  for (const id of new Set(ids))
    localStorage.removeItem("researchos-stages-" + id);
}

export function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
