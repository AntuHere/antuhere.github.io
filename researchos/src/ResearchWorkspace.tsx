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
    checks: [
      "Define problem statement",
      "Write objectives and research questions",
      "Assess novelty and feasibility",
      "Confirm scope and expected contribution",
    ],
  },
  {
    title: "Literature review",
    description: "Search, compare and synthesize evidence",
    checks: [
      "Create search strategy and keywords",
      "Collect core references",
      "Build literature comparison matrix",
      "Summarize research gaps",
    ],
  },
  {
    title: "Research methodology",
    description: "Design, variables, evaluation and reproducibility",
    checks: [
      "Specify study design",
      "Define variables and metrics",
      "Plan validation and analysis",
      "Document methodology and limitations",
    ],
  },
  {
    title: "Data collection",
    description: "Source, record and document datasets",
    checks: [
      "Finalize collection protocol",
      "Organize raw data and field notes",
      "Record metadata and provenance",
      "Verify dataset quality",
    ],
  },
  {
    title: "Data processing",
    description: "Cleaning, annotation and preparation",
    checks: [
      "Clean and organize data",
      "Document preprocessing steps",
      "Prepare annotated/analysis-ready files",
      "Perform quality assurance",
    ],
  },
  {
    title: "Model & experiments",
    description: "Implementation, baseline tests and validation",
    checks: [
      "Establish baseline method",
      "Implement experiments",
      "Track model versions and parameters",
      "Validate errors and uncertainty",
    ],
  },
  {
    title: "Analysis & results",
    description: "Evidence, interpretation and figures",
    checks: [
      "Run planned analyses",
      "Prepare tables and visualizations",
      "Interpret findings against objectives",
      "Document robustness and limitations",
    ],
  },
  {
    title: "Manuscript writing",
    description: "Turn findings into a coherent paper",
    checks: [
      "Draft abstract and introduction",
      "Write methods and results",
      "Write discussion and conclusion",
      "Review references, figures and formatting",
    ],
  },
  {
    title: "Review & submission",
    description: "Finalize and submit",
    checks: [
      "Address supervisor comments",
      "Check target journal requirements",
      "Complete final manuscript checks",
      "Record submission and revision history",
    ],
  },
] as const;
type StageData = {
  checked: boolean[];
  notes: string;
  status: "Not started" | "In progress" | "Complete";
};
type WorkflowData = Record<string, StageData>;
const stagesKey = (id: string) => "researchos-stages-" + id;
function loadStages(id: string): WorkflowData {
  try {
    return JSON.parse(localStorage.getItem(stagesKey(id)) || "{}");
  } catch {
    return {};
  }
}
const stagesOf = (state: WorkflowData, i: number): StageData =>
  state[String(i)] || {
    checked: [false, false, false, false],
    notes: "",
    status: "Not started",
  };

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
    setState((s) => ({ ...s, [i]: { ...stagesOf(s, i), ...changes } }));
  const selected = stagesOf(state, stage);
  const completedStages = STAGES.filter(
    (_, i) => stagesOf(state, i).status === "Complete",
  ).length;
  const checklistCount = STAGES.reduce(
    (sum, _, i) => sum + stagesOf(state, i).checked.filter(Boolean).length,
    0,
  );
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
              <span>{checklistCount}/36 checks</span>
            </div>
            <div className="rw-stage-progress">
              <div style={{ width: `${(checklistCount / 36) * 100}%` }} />
            </div>
            {STAGES.map((s, i) => {
              const d = stagesOf(state, i);
              return (
                <button
                  key={s.title}
                  className={`rw-stage ${stage === i ? "active" : ""}`}
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
                      {d.status} · {d.checked.filter(Boolean).length}/4
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
            <div className="rw-inner-card">
              <h4>Stage checklist</h4>
              {STAGES[stage].checks.map((item, i) => (
                <label className="rw-check" key={item}>
                  <input
                    type="checkbox"
                    checked={selected.checked[i] || false}
                    onChange={(e) => {
                      const checked = [...selected.checked];
                      checked[i] = e.target.checked;
                      updateStage(stage, { checked });
                    }}
                  />
                  <span>{item}</span>
                </label>
              ))}
              <div className="rw-hint">
                Checklists are editable by status and saved automatically in
                this browser.
              </div>
            </div>
            <div className="rw-inner-card">
              <div className="rw-between">
                <h4>Working notes for this stage</h4>
                <span className="rw-autosave">
                  {saveError ? "Not saved" : "Auto-saved"}
                </span>
              </div>
              <textarea
                aria-label="Working notes for this stage"
                className="rw-stage-notes"
                value={selected.notes}
                onChange={(e) => updateStage(stage, { notes: e.target.value })}
                placeholder="Methods, decisions, links, observations, what to do next..."
                rows={6}
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
                onClick={() =>
                  onCreate("note", {
                    projectId: project.id,
                    title: STAGES[stage].title + " — research notes",
                    body: selected.notes,
                  })
                }
              >
                <NotebookPen size={15} />
                Save as separate note
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
