import type { Note } from "./data";

export type StageTodo = { id: string; title: string; done: boolean };
export type WorkflowStage = {
  // Retained so older workflow backups keep their original completion history.
  checked: boolean[];
  notes: string;
  status: "Not started" | "In progress" | "Complete";
  todos?: StageTodo[];
  stickyNotes?: Note[];
};
export type WorkflowData = Record<string, WorkflowStage>;
export type StageData = WorkflowStage & {
  todos: StageTodo[];
  stickyNotes: Note[];
};
export const stagesKey = (id: string) => "researchos-stages-" + id;
export function loadStages(id: string): WorkflowData {
  try {
    return JSON.parse(localStorage.getItem(stagesKey(id)) || "{}");
  } catch {
    return {};
  }
}
export function stagesOf(
  state: WorkflowData,
  index: number,
  projectId: string,
): StageData {
  const saved = state[String(index)];
  return {
    checked: saved?.checked ?? [false, false, false, false],
    notes: saved?.notes ?? "",
    status: saved?.status ?? "Not started",
    todos: saved?.todos ?? [],
    // An explicitly empty stickyNotes array means the user deleted the old note.
    // Missing arrays in older backups convert working text into one editable note.
    stickyNotes:
      saved?.stickyNotes ??
      (saved?.notes?.trim()
        ? [
            {
              id: `legacy-stage-note-${projectId}-${index}`,
              projectId,
              title: "Working notes",
              body: saved.notes,
              updated: "Saved previously",
              color: "yellow",
              pinned: false,
            },
          ]
        : []),
  };
}
