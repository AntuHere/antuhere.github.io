import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Cloud,
  Download,
  ExternalLink,
  File,
  FileText,
  FolderOpen,
  Link2,
  NotebookPen,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Upload,
  Workflow,
  AlertTriangle,
} from "lucide-react";
import {
  uid,
  today,
  type Project,
  type Store,
  type Task,
  type Note,
  type Asset,
  type Paper,
} from "./data";
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

const DB_NAME = "researchos-document-vault-v1";
const TABLE = "documents";
type VaultRecord = {
  id: string;
  projectId: string;
  name: string;
  size: number;
  type: string;
  created: string;
  file: Blob;
};
function connect(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains(TABLE))
        r.result.createObjectStore(TABLE, { keyPath: "id" });
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function vaultOperation<T>(
  mode: IDBTransactionMode,
  work: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const d = await connect();
  try {
    return await new Promise<T>((resolve, reject) => {
      const t = d.transaction(TABLE, mode);
      const req = work(t.objectStore(TABLE));
      t.oncomplete = () => resolve(req.result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
      req.onerror = () => reject(req.error);
    });
  } finally {
    d.close();
  }
}
async function addVault(record: VaultRecord) {
  await vaultOperation("readwrite", (s) => s.put(record));
}
async function deleteVault(id: string) {
  await vaultOperation("readwrite", (s) => s.delete(id));
}
async function getVault(): Promise<VaultRecord[]> {
  return vaultOperation("readonly", (s) => s.getAll());
}
const readable = (size: number) =>
  size < 1048576
    ? `${(size / 1024).toFixed(1)} KB`
    : `${(size / 1048576).toFixed(1)} MB`;
const safeOpen = (url: string) => {
  if (/^https?:\/\//i.test(url))
    window.open(url, "_blank", "noopener,noreferrer");
};

interface Props {
  project: Project;
  store: Store;
  onCreate: (
    kind: "task" | "note" | "paper" | "asset",
    initial: Record<string, string>,
  ) => void;
  onEditNote: (note: Note) => void;
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
  onEditNote,
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
  const [files, setFiles] = useState<VaultRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setState(loadStages(project.id));
    setStage(0);
    setTab("workflow");
    setError("");
  }, [project.id]);
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
  const refresh = async () => {
    try {
      setFiles(
        (await getVault())
          .filter((f) => f.projectId === project.id)
          .sort((a, b) => b.created.localeCompare(a.created)),
      );
    } catch {
      setError("Document storage unavailable in this browser.");
    }
  };
  useEffect(() => {
    void refresh();
  }, [project.id]);
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
  const docs = files.filter((f) =>
    f.name.toLowerCase().includes(filter.toLowerCase()),
  );
  const links = store.assets.filter(
    (a) =>
      a.projectId === project.id &&
      (a.name + " " + a.kind).toLowerCase().includes(filter.toLowerCase()),
  );
  const notes = store.notes.filter((n) => n.projectId === project.id);
  const papers = store.papers.filter((p) => p.projectId === project.id);
  const tasks = store.tasks.filter((t) => t.projectId === project.id);
  const addFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    setError("");
    try {
      for (const file of Array.from(list)) {
        if (file.size > 50 * 1024 * 1024)
          throw Error(
            "Files above 50 MB should be stored in Google Drive and linked here.",
          );
        await addVault({
          id: uid(),
          projectId: project.id,
          name: file.name,
          size: file.size,
          type: file.type,
          created: new Date().toISOString(),
          file,
        });
      }
      await refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save file. Check browser storage space.",
      );
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };
  const openFile = (record: VaultRecord, download = false) => {
    const url = URL.createObjectURL(record.file);
    const a = document.createElement("a");
    a.href = url;
    a.download = download ? record.name : "";
    if (!download) a.target = "_blank";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
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
        <div className="rw-pane">
          <div className="rw-section-heading">
            <div>
              <h3>Research documents & files</h3>
              <p>
                Upload drafts and PDFs locally or add links to your Google Drive
                documents.
              </p>
            </div>
            <div className="rw-actions">
              <input
                type="file"
                ref={fileInput}
                multiple
                hidden
                onChange={(e) => void addFiles(e.target.files)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.ppt,.pptx,.png,.jpg,.jpeg,.zip,.json"
              />
              <button
                className="rw-button primary"
                disabled={busy}
                onClick={() => fileInput.current?.click()}
              >
                <Upload size={15} />
                {busy ? "Saving..." : "Upload files"}
              </button>
              <button
                className="rw-button"
                onClick={() =>
                  onCreate("asset", {
                    projectId: project.id,
                    kind: "Google Drive / document link",
                  })
                }
              >
                <Link2 size={15} />
                Add Drive link
              </button>
            </div>
          </div>
          <div className="rw-caution">
            <AlertTriangle size={17} /> Uploaded files are stored only in this
            browser (IndexedDB). They won't sync to your phone, and JSON backup
            does not include file contents. Keep originals on Google Drive.
          </div>
          {error && <div className="rw-error">{error}</div>}
          <div className="rw-toolbar">
            <Search size={15} />
            <input
              placeholder="Search files and links"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <span>{docs.length + links.length} items</span>
          </div>
          <div className="rw-files">
            {docs.map((f) => (
              <div className="rw-file" key={f.id}>
                <div className="rw-file-icon">
                  <FileText size={21} />
                </div>
                <div className="rw-file-info">
                  <b>{f.name}</b>
                  <small>
                    Local upload · {readable(f.size)} ·{" "}
                    {new Date(f.created).toLocaleDateString()}
                  </small>
                </div>
                <button title="Open file" onClick={() => openFile(f)}>
                  <ExternalLink size={16} />
                </button>
                <button title="Download file" onClick={() => openFile(f, true)}>
                  <Download size={16} />
                </button>
                <button
                  title="Delete file"
                  onClick={async () => {
                    if (confirm("Remove this browser copy?")) {
                      await deleteVault(f.id);
                      await refresh();
                    }
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {links.map((a) => (
              <div className="rw-file" key={a.id}>
                <div className="rw-file-icon">
                  <Link2 size={20} />
                </div>
                <div className="rw-file-info">
                  <b>{a.name}</b>
                  <small>{a.kind} · linked resource</small>
                </div>
                {a.url ? (
                  <button
                    title="Open external link"
                    onClick={() => safeOpen(a.url)}
                  >
                    <ExternalLink size={16} />
                  </button>
                ) : (
                  <small className="rw-missing">No URL added</small>
                )}
              </div>
            ))}
            {docs.length + links.length === 0 && (
              <div className="rw-empty">
                <FolderOpen size={28} />
                <b>No documents here yet</b>
                <p>
                  Add a PDF, DOCX, CSV or a Google Drive link to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {tab === "notes" && (
        <div className="rw-pane">
          <div className="rw-section-heading">
            <div>
              <h3>Research notebook</h3>
              <p>
                Keep insights, meeting notes, decisions and ideas tied to this
                paper.
              </p>
            </div>
            <button
              className="rw-button primary"
              onClick={() => onCreate("note", { projectId: project.id })}
            >
              <Plus size={15} />
              New note
            </button>
          </div>
          <div className="rw-notes-grid">
            {notes.map((n) => (
              <div className="rw-note-card" key={n.id}>
                <div className="rw-note-header">
                  <NotebookPen size={19} />
                  <small>{n.updated}</small>
                </div>
                <h4>{n.title}</h4>
                <p>{n.body || "Empty note"}</p>
                <div className="rw-actions">
                  <button className="rw-button" onClick={() => onEditNote(n)}>
                    Edit note
                  </button>
                  <button
                    className="rw-button danger"
                    onClick={() => onDeleteNote(n.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {notes.length === 0 && (
              <div className="rw-empty">
                Start your research notebook with the first observation or
                meeting note.
              </div>
            )}
          </div>
        </div>
      )}
      {tab === "literature" && (
        <div className="rw-pane">
          <div className="rw-section-heading">
            <div>
              <h3>Literature & evidence library</h3>
              <p>
                References, DOI, key findings, and reading status for this
                research.
              </p>
            </div>
            <button
              className="rw-button primary"
              onClick={() => onCreate("paper", { projectId: project.id })}
            >
              <Plus size={15} />
              Add paper
            </button>
          </div>
          <div className="rw-files">
            {papers.map((p) => (
              <div className="rw-file" key={p.id}>
                <div className="rw-file-icon">
                  <BookOpen size={20} />
                </div>
                <div className="rw-file-info">
                  <b>{p.title}</b>
                  <small>
                    {p.authors || "Author not specified"} ·{" "}
                    {p.year || "No year"} · {p.status}
                  </small>
                  <p>{p.notes || "No notes yet"}</p>
                </div>
                {p.url && (
                  <button onClick={() => safeOpen(p.url)} title="Open paper">
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            ))}
            {papers.length === 0 && (
              <div className="rw-empty">
                No literature linked to this project yet.
              </div>
            )}
          </div>
          <button
            className="rw-link"
            onClick={() => onOpenSection("literature", project.id)}
          >
            Open literature table <ChevronRight size={15} />
          </button>
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
