import StageTodos from "./StageTodos";
import {
  loadStages,
  stagesKey,
  stagesOf,
  type StageData,
  type WorkflowData,
} from "./workflow";
import DocumentsVault from "./DocumentsVault";
import StickyNotes from "./StickyNotes";
import LiteratureSheet from "./LiteratureSheet";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FolderOpen,
  NotebookPen,
  Plus,
  Workflow,
} from "lucide-react";
import { type Project, type Store, type Note, type Paper } from "./data";
import "./workspace.css";

const STAGES = [
  {
    title: "Research concept",
    description: "Problem, objectives, hypotheses and scope",
  },
  {
    title: "Literature review",
    description: "Search, compare and synthesize evidence",
  },
  {
    title: "Research methodology",
    description: "Design, variables, evaluation and reproducibility",
  },
  {
    title: "Data collection",
    description: "Source, record and document datasets",
  },
  {
    title: "Data processing",
    description: "Cleaning, annotation and preparation",
  },
  {
    title: "Model & experiments",
    description: "Implementation, baseline tests and validation",
  },
  {
    title: "Analysis & results",
    description: "Evidence, interpretation and figures",
  },
  {
    title: "Manuscript writing",
    description: "Turn findings into a coherent paper",
  },
  {
    title: "Review & submission",
    description: "Finalize and submit",
  },
] as const;
interface Props {
  project: Project;
  store: Store;
  onCreate: (
    kind: "task" | "note" | "paper" | "asset",
    initial: Record<string, string>,
  ) => void;
  onCreateNote: (note: Note) => void;
  onPatchNote: (id: string, data: Partial<Note>) => void;
  onPatchPaper: (id: string, data: Partial<Paper>) => void;
  onDeletePaper: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onOpenSection: (
    section: "tasks" | "literature" | "assets" | "notes",
    projectId: string,
  ) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
}
export default function ResearchWorkspace({
  project,
  store,
  onCreate,
  onCreateNote,
  onPatchNote,
  onPatchPaper,
  onDeletePaper,
  onDeleteNote,
  onOpenSection,
  onUpdateProject,
}: Props) {
  const [tab, setTab] = useState<
    "workflow" | "documents" | "notes" | "literature" | "tasks"
  >("workflow");
  const [stage, setStage] = useState(0);
  const [state, setState] = useState<WorkflowData>(() =>
    loadStages(project.id),
  );
  const [saveError, setSaveError] = useState("");
  useEffect(() => {
    try {
      localStorage.setItem(stagesKey(project.id), JSON.stringify(state));
      setSaveError("");
    } catch {
      setSaveError(
        "Stage changes could not be saved. Browser storage may be full or unavailable.",
      );
    }
  }, [project.id, state]);
  const updateStage = (i: number, changes: Partial<StageData>) =>
    setState((s) => ({
      ...s,
      [i]: { ...stagesOf(s, i, project.id), ...changes },
    }));
  const selected = stagesOf(state, stage, project.id);
  const completedStages = STAGES.filter(
    (_, i) => stagesOf(state, i, project.id).status === "Complete",
  ).length;
  const allTodos = STAGES.flatMap(
    (_, i) => stagesOf(state, i, project.id).todos,
  );
  const completedTodos = allTodos.filter((todo) => todo.done).length;
  const notes = store.notes.filter((n) => n.projectId === project.id);
  const papers = store.papers.filter((p) => p.projectId === project.id);
  const tasks = store.tasks.filter((t) => t.projectId === project.id);
  const tabs = [
    ["workflow", "Workflow", Workflow],
    ["documents", "Documents vault", FolderOpen],
    ["notes", "Research notes", NotebookPen],
    ["literature", "Literature", BookOpen],
    ["tasks", "Tasks", ClipboardList],
  ] as const;
  return (
    <section className="rw">
      {saveError && (
        <div className="rw-error" role="alert">
          {saveError}
        </div>
      )}
      <div className="rw-banner">
        <div>
          <span className="rw-eyebrow">RESEARCH COMMAND CENTER</span>
          <h2>Manage the entire research process</h2>
          <p>
            Stages, working files, reading, notes, and action items — organized
            inside this paper.
          </p>
        </div>
        <div className="rw-banner-metric">
          <strong>
            {completedStages}
            <span>/{STAGES.length}</span>
          </strong>
          <small>stages completed</small>
        </div>
      </div>
      <div
        className="rw-tabs"
        role="tablist"
        aria-label="Project workspace sections"
      >
        {tabs.map(([key, label, Icon]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? "rw-tab active" : "rw-tab"}
            onClick={() => setTab(key)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      {tab === "workflow" && (
        <div className="rw-workflow">
          <aside className="rw-stages">
            <div className="rw-stages-top">
              <b>Research pipeline</b>
              <span>
                {completedTodos}/{allTodos.length} work steps
              </span>
            </div>
            <div className="rw-stage-progress">
              <div
                style={{
                  width: `${allTodos.length ? (completedTodos / allTodos.length) * 100 : 0}%`,
                }}
              />
            </div>
            {STAGES.map((s, i) => {
              const d = stagesOf(state, i, project.id);
              return (
                <button
                  key={s.title}
                  className={`rw-stage ${stage === i ? "active" : ""}`}
                  aria-current={stage === i ? "step" : undefined}
                  onClick={() => setStage(i)}
                >
                  <span
                    className={`rw-stage-number ${d.status === "Complete" ? "done" : ""}`}
                  >
                    {d.status === "Complete" ? (
                      <Check size={15} />
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </span>
                  <span className="rw-stage-label">
                    <b>{s.title}</b>
                    <small>
                      {d.status} · {d.todos.filter((todo) => todo.done).length}/
                      {d.todos.length} steps
                    </small>
                  </span>
                  <ChevronRight size={15} />
                </button>
              );
            })}
          </aside>
          <div className="rw-stage-body">
            <div className="rw-section-heading">
              <div>
                <span className="rw-eyebrow">
                  STAGE {String(stage + 1).padStart(2, "0")} OF 09
                </span>
                <h3>{STAGES[stage].title}</h3>
                <p>{STAGES[stage].description}</p>
              </div>
              <select
                value={selected.status}
                aria-label="Stage status"
                onChange={(e) =>
                  updateStage(stage, {
                    status: e.target.value as StageData["status"],
                  })
                }
              >
                <option>Not started</option>
                <option>In progress</option>
                <option>Complete</option>
              </select>
            </div>
            <StageTodos
              key={stage}
              todos={selected.todos}
              onChange={(todos) => updateStage(stage, { todos })}
            />
            <div className="rw-inner-card rw-stage-sticky-notes">
              <div className="rw-between">
                <h4>Stage sticky notes</h4>
                <span className="rw-autosave">
                  {saveError ? "Not saved" : "Auto-saved"}
                </span>
              </div>
              <StickyNotes
                label="Stage sticky notes"
                projectLocked
                notes={selected.stickyNotes}
                projects={[project]}
                projectId={project.id}
                onCreate={(note) =>
                  updateStage(stage, {
                    stickyNotes: [...selected.stickyNotes, note],
                  })
                }
                onChange={(id, data) =>
                  updateStage(stage, {
                    stickyNotes: selected.stickyNotes.map((note) =>
                      note.id === id ? { ...note, ...data } : note,
                    ),
                  })
                }
                onDelete={(id) => {
                  if (confirm("Delete this stage note?"))
                    updateStage(stage, {
                      stickyNotes: selected.stickyNotes.filter(
                        (note) => note.id !== id,
                      ),
                    });
                }}
              />
            </div>
            <div className="rw-actions">
              <button
                className="rw-button primary"
                onClick={() =>
                  onCreate("task", { projectId: project.id, title: "" })
                }
              >
                <Plus size={15} />
                Add research task
              </button>
              <button
                className="rw-button"
                disabled={stage === 8}
                onClick={() => setStage((i) => Math.min(8, i + 1))}
              >
                Next stage <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
      {tab === "documents" && (
        <DocumentsVault
          project={project}
          links={store.assets.filter((a) => a.projectId === project.id)}
          onAddLink={() =>
            onCreate("asset", {
              projectId: project.id,
              kind: "Google Drive / document link",
            })
          }
        />
      )}
      {tab === "notes" && (
        <div className="rw-pane">
          <h3>Sticky notes</h3>
          <StickyNotes
            notes={notes}
            projects={store.projects}
            projectId={project.id}
            onCreate={onCreateNote}
            onChange={onPatchNote}
            onDelete={onDeleteNote}
          />
        </div>
      )}
      {tab === "literature" && (
        <div className="rw-pane">
          <div className="rw-section-heading">
            <h3>Paper tracking sheet</h3>
            <button
              className="rw-button primary"
              onClick={() => onCreate("paper", { projectId: project.id })}
            >
              Add paper
            </button>
          </div>
          <LiteratureSheet
            papers={papers}
            projects={store.projects}
            onChange={onPatchPaper}
            onDelete={onDeletePaper}
          />
        </div>
      )}
      {tab === "tasks" && (
        <div className="rw-pane">
          <div className="rw-section-heading">
            <div>
              <h3>Research action plan</h3>
              <p>Track what needs to happen next across every stage.</p>
            </div>
            <button
              className="rw-button primary"
              onClick={() => onCreate("task", { projectId: project.id })}
            >
              <Plus size={15} />
              Add task
            </button>
          </div>
          <div className="rw-files">
            {tasks.map((t) => (
              <div key={t.id} className="rw-file">
                <div className="rw-file-icon">
                  {t.status === "Done" ? (
                    <CheckCircle2 size={19} />
                  ) : (
                    <ClipboardList size={19} />
                  )}
                </div>
                <div className="rw-file-info">
                  <b>{t.title}</b>
                  <small>
                    {t.status} · {t.priority} priority ·{" "}
                    {t.due || "No deadline"}
                  </small>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="rw-empty">No tasks for this project yet.</div>
            )}
          </div>
          <button
            className="rw-link"
            onClick={() => onOpenSection("tasks", project.id)}
          >
            Open task board <ChevronRight size={15} />
          </button>
        </div>
      )}
    </section>
  );
}
