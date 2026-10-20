import AdminGate, { useAdmin } from "./AdminGate";
import GoogleGate, { useGoogle } from "./GoogleGate";
import StickyNotes from "./StickyNotes";
import LiteratureSheet from "./LiteratureSheet";
import AIAssistant from "./AIAssistant";
import { stageFile, syncFile } from "./vault";
import ResearchWorkspace from "./ResearchWorkspace";
import {
  parseBackup,
  replaceWorkflows,
  clearWorkflows,
  safeUrl,
} from "./storage";
import { useModalFocus } from "./useModalFocus";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  BookOpen,
  Database,
  NotebookPen,
  Users,
  Settings,
  Search,
  Plus,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  Clock3,
  CheckCircle2,
  Circle,
  Menu,
  X,
  FlaskConical,
  ChartNoAxesCombined,
  Download,
  Upload,
  ExternalLink,
  Trash2,
  ShieldCheck,
  AlertCircle,
  FileText,
  Target,
  ArrowRight,
  Filter,
  Sun,
  Moon,
  LockKeyhole,
  Archive,
  Check,
  RefreshCcw,
  Activity,
} from "lucide-react";
import {
  seed,
  loadStore,
  storageKey,
  uid,
  today,
  type Store,
  type Project,
  type Task,
  type Paper,
  type Asset,
  type Note,
  type Member,
  type Status,
} from "./data";
import "./style.css";
type View =
  | "overview"
  | "projects"
  | "tasks"
  | "literature"
  | "assets"
  | "notes"
  | "team"
  | "settings"
  | "assistant";
type Modal = "project" | "task" | "paper" | "asset" | "note" | "member" | null;
const menu: [View, string, any][] = [
  ["overview", "Overview", LayoutDashboard],
  ["projects", "Projects", FolderKanban],
  ["tasks", "Task board", ListTodo],
  ["literature", "Literature library", BookOpen],
  ["assets", "Assets & data", Database],
  ["notes", "Research notes", NotebookPen],
  ["assistant", "AI assistant", FlaskConical],
];
const fmt = (date: string) =>
  date
    ? new Date(date + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "No deadline";
const nl = (n: number) => String(n).padStart(2, "0");
function App() {
  const { drive, email, connection } = useGoogle();
  const { signOut } = useAdmin();
  const [proposal, setProposal] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [db, setDb] = useState<Store>(loadStore);
  const [view, setView] = useState<View>("overview");
  const [project, setProject] = useState("all");
  const [focus, setFocus] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [mobile, setMobile] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      return localStorage.getItem("researchos-theme") === "light"
        ? "light"
        : "dark";
    } catch {
      return "dark";
    }
  });
  const [toast, setToast] = useState("");
  const [taskMode, setTaskMode] = useState<"board" | "list">("board");
  const [form, setForm] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [storageError, setStorageError] = useState("");
  useModalFocus(Boolean(modal), () => setModal(null));
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(db));
      setStorageError("");
    } catch {
      setStorageError(
        "Changes could not be saved in this browser. Export a backup before closing this page.",
      );
    }
  }, [db]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("researchos-theme", theme);
    } catch {}
  }, [theme]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3600);
    return () => clearTimeout(t);
  }, [toast]);
  const projectName = (id: string) =>
    db.projects.find((p) => p.id === id)?.short || "Unknown project";
  const filtered = (id: string) => project === "all" || project === id;
  const matches = (...texts: string[]) =>
    !query || texts.join(" ").toLowerCase().includes(query.toLowerCase());
  const shownProjects = db.projects.filter((p) =>
    matches(p.name, p.description, p.phase),
  );
  const shownTasks = db.tasks.filter(
    (t) =>
      filtered(t.projectId) &&
      matches(t.title, projectName(t.projectId), t.priority),
  );
  const shownPapers = db.papers.filter(
    (x) =>
      filtered(x.projectId) &&
      matches(
        x.title,
        x.authors,
        x.notes,
        x.abstractSummary || "",
        x.gap || "",
        x.doi,
      ),
  );
  const shownAssets = db.assets.filter(
    (x) => filtered(x.projectId) && matches(x.name, x.kind),
  );
  const shownNotes = db.notes.filter(
    (x) => filtered(x.projectId) && matches(x.title, x.body),
  );
  const picked = db.projects.find((p) => p.id === focus);
  const totalTasks = db.tasks.length,
    complete = db.tasks.filter((t) => t.status === "Done").length,
    active = db.projects.filter(
      (p) => !["Published", "Submitted", "Idea"].includes(p.status),
    ).length;
  const upcoming = db.tasks
    .filter((t) => t.status !== "Done" && t.due)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5);
  const mutate = (key: keyof Store, item: any) =>
    setDb((old) => ({ ...old, [key]: [...old[key], item] }));
  const patch = (key: keyof Store, id: string, data: any) =>
    setDb((old) => ({
      ...old,
      [key]: (old[key] as any[]).map((item) =>
        item.id === id ? { ...item, ...data } : item,
      ),
    }));
  const remove = (key: keyof Store, id: string) => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    setDb((old) => ({
      ...old,
      [key]: (old[key] as any[]).filter((x) => x.id !== id),
    }));
    setToast("Item deleted");
  };
  const notify = (s: string) => setToast(s);
  const open = (
    m: Modal,
    initial: Record<string, string> = {},
    id: string | null = null,
  ) => {
    setProposal(null);
    setEditing(id);
    setForm(initial);
    setModal(m);
  };
  const [driveError, setDriveError] = useState("");
  const save = async () => {
    if (saving) return;
    const name = (form.title || form.name || "").trim();
    if (!name && modal !== "member") {
      notify("Please enter a title or name");
      return;
    }
    if (modal === "project") {
      const x: Project = {
        id: editing || uid(),
        name: form.name,
        short: form.name,
        description: form.description || "",
        status: (form.status || "Idea") as Status,
        phase: form.phase || "Idea exploration",
        progress: Number(form.progress || 0),
        color: form.color || "#7769ec",
        icon: "layers",
        updated: fmt(today()),
        deadline: form.deadline || "",
        members: db.projects.find((p) => p.id === editing)?.members || 1,
        visibility: form.visibility === "Shared" ? "Shared" : "Private",
        goal: form.goal || "",
      };
      setSaving(true);
      let attachment;
      try {
        if (proposal)
          attachment = await stageFile(x, "Research Proposal", proposal);
      } catch (e) {
        setSaving(false);
        notify((e as Error).message);
        return;
      }
      editing ? patch("projects", editing, x) : mutate("projects", x);
      setDriveError("");
      setModal(null);
      if (!drive) {
        setSaving(false);
        notify(
          attachment
            ? "Project and proposal saved in this browser. Connect Drive later to upload."
            : "Project saved in this browser",
        );
        return;
      }
      try {
        await drive.ensureProject(x);
        if (attachment) await syncFile(drive, x, attachment);
        notify("Project folder ready in Drive");
      } catch (e) {
        setDriveError(
          "Project saved in this browser. Drive setup/upload needs retry in its Documents vault: " +
            (e as Error).message,
        );
      } finally {
        setSaving(false);
      }
      return;
    } else if (modal === "task") {
      const x: Task = {
        id: editing || uid(),
        projectId: form.projectId || db.projects[0]?.id || "",
        title: form.title,
        status: (form.status || "To do") as Task["status"],
        priority: (form.priority || "Medium") as Task["priority"],
        due: form.due || "",
        assignee: form.assignee || "Me",
      };
      editing ? patch("tasks", editing, x) : mutate("tasks", x);
    } else if (modal === "paper") {
      const x: Paper = {
        id: editing || uid(),
        projectId: form.projectId || db.projects[0]?.id || "",
        title: form.title,
        authors: form.authors || "",
        year: form.year || "",
        doi: form.doi || "",
        status: (form.status || "To read") as Paper["status"],
        notes: form.notes || "",
        abstractSummary: form.abstractSummary || "",
        gap: form.gap || "",
        methods: form.methods || "",
        findings: form.findings || "",
        relevance: form.relevance || "",
        url: form.url || "",
      };
      editing ? patch("papers", editing, x) : mutate("papers", x);
    } else if (modal === "asset") {
      const x: Asset = {
        id: editing || uid(),
        projectId: form.projectId || db.projects[0]?.id || "",
        name: form.name,
        kind: form.kind || "Link",
        url: form.url || "",
        updated: fmt(today()),
      };
      editing ? patch("assets", editing, x) : mutate("assets", x);
    } else if (modal === "note") {
      const x: Note = {
        id: editing || uid(),
        projectId: form.projectId || db.projects[0]?.id || "",
        title: form.title,
        body: form.body || "",
        updated: fmt(today()),
      };
      editing ? patch("notes", editing, x) : mutate("notes", x);
    } else if (modal === "member") {
      if (!/^\S+@\S+\.\S+$/.test(form.email || "")) {
        notify("Enter a valid email");
        return;
      }
      const x: Member = {
        id: uid(),
        projectId: form.projectId || db.projects[0]?.id || "",
        email: form.email,
        role: (form.role || "Viewer") as Member["role"],
        status: "Planned invite",
      };
      mutate("members", x);
      notify("Collaborator saved as a planned invite — no email was sent");
    }
    setModal(null);
    if (modal !== "member")
      notify(editing ? "Changes saved locally" : "Added to your workspace");
  };
  const exportData = () => {
    const stageWorkflows = Object.fromEntries(
      db.projects.map((p) => [
        p.id,
        JSON.parse(localStorage.getItem("researchos-stages-" + p.id) || "{}"),
      ]),
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(
        [JSON.stringify({ ...db, __stageWorkflows: stageWorkflows }, null, 2)],
        { type: "application/json" },
      ),
    );
    a.download = `researchos-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    notify("Workspace backup downloaded");
  };
  const importData = async (file: File) => {
    try {
      const { store, workflows } = parseBackup(await file.text());
      if (confirm("Replace your current local workspace with this backup?")) {
        replaceWorkflows(
          store.projects.map((p) => p.id),
          workflows,
        );
        setDb(store);
        setProject("all");
        setFocus(null);
        notify("Backup restored");
      }
    } catch {
      notify(
        "Could not restore backup. Check that it is a valid ResearchOS export and browser storage is available.",
      );
    }
  };
  const editProject = (p: Project) =>
    open(
      "project",
      {
        ...Object.fromEntries(
          Object.entries(p).map(([k, v]) => [k, String(v)]),
        ),
      },
      p.id,
    );
  const cardTask = (t: Task) => (
    <div className="task-card" key={t.id}>
      <div className="task-card-top">
        <span className={`priority ${t.priority.toLowerCase()}`}>
          {t.priority}
        </span>
        <button
          className="icon-btn tiny"
          title="Delete task"
          onClick={() => remove("tasks", t.id)}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <button
        className="task-name"
        onClick={() =>
          open(
            "task",
            Object.fromEntries(
              Object.entries(t).map(([k, v]) => [k, String(v)]),
            ),
            t.id,
          )
        }
      >
        {t.title}
      </button>
      <div className="task-card-footer">
        <span
          className="project-dot"
          style={{
            background: db.projects.find((p) => p.id === t.projectId)?.color,
          }}
        />
        {projectName(t.projectId)}
        <span className="push" />
        <Clock3 size={12} />
        {fmt(t.due)}
      </div>
      <div className="task-actions">
        {(["To do", "In progress", "Done"] as const)
          .filter((s) => s !== t.status)
          .map((s) => (
            <button key={s} onClick={() => patch("tasks", t.id, { status: s })}>
              {s === "Done" ? "✓ " : ""}
              {s}
            </button>
          ))}
      </div>
    </div>
  );
  return (
    <div className="app">
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-symbol">
            <FlaskConical size={23} />
          </div>
          <div>
            <strong>
              Research<span>OS</span>
            </strong>
            <small>Research command center</small>
          </div>
          <button
            className="close-sidebar icon-btn"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {menu.map(([v, label, Icon]) => (
            <button
              aria-label={label}
              className={`nav-item ${view === v ? "active" : ""}`}
              key={v}
              onClick={() => {
                setView(v);
                setFocus(null);
                setMobile(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {v === "projects" && <small>{db.projects.length}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-projects">
          <div className="nav-label line-title">
            YOUR PROJECTS{" "}
            <button onClick={() => open("project")} title="New project">
              <Plus size={15} />
            </button>
          </div>
          {db.projects.slice(0, 5).map((p) => (
            <button
              key={p.id}
              className={`side-project ${focus === p.id ? "selected" : ""}`}
              onClick={() => {
                setFocus(p.id);
                setView("projects");
                setMobile(false);
              }}
            >
              <span className="project-dot" style={{ background: p.color }} />
              {p.short}
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <a className="nav-item portfolio-link" href="/">
            <ArrowUpRight size={18} /> Back to portfolio
          </a>
          <button
            className={`nav-item ${view === "settings" ? "active" : ""}`}
            onClick={() => {
              setView("settings");
              setFocus(null);
              setMobile(false);
            }}
          >
            <Settings size={18} />
            Settings
          </button>
          <div className="identity">
            <div className="avatar">AH</div>
            <div>
              <b>My workspace</b>
              <small>Saved in this browser</small>
            </div>
            <ChevronDown size={16} />
          </div>
        </div>
      </aside>
      {mobile && <div className="backdrop" onClick={() => setMobile(false)} />}
      <div className="main">
        <header className="topbar">
          <button
            className="icon-btn mobile-menu"
            aria-label="Open navigation"
            aria-expanded={mobile}
            onClick={() => setMobile(true)}
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>
              {picked?.short ||
                (
                  {
                    overview: "Overview",
                    projects: "Projects",
                    tasks: "Task board",
                    literature: "Literature library",
                    assets: "Assets & data",
                    notes: "Research notes",
                    team: "Collaboration",
                    settings: "Settings",
                    assistant: "AI assistant",
                  } as any
                )[view]}
            </strong>
          </div>
          <div className="top-controls">
            <div className="search">
              <Search size={17} />
              <input
                type="search"
                aria-label="Search workspace"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search workspace..."
              />
              <kbd>⌕</kbd>
            </div>
            <button
              className="icon-btn theme-toggle"
              title="Toggle theme"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="rw-button" title={email} onClick={signOut}>
              Sign out
            </button>
          </div>
        </header>
        <main className="content">
          {driveError && (
            <div className="notice orange-notice" role="alert">
              {driveError}
            </div>
          )}
          {storageError && (
            <div className="notice orange-notice" role="alert">
              {storageError}
            </div>
          )}
          <div className="local-storage-banner">
            <ShieldCheck size={16} />
            <span>
              <strong>
                {drive ? "Google Drive connected" : "Local workspace"}
              </strong>{" "}
              ·{" "}
              {drive
                ? "Files sync through each project’s vault."
                : "Files save in this browser. Connect Drive in Settings when you want uploads."}{" "}
              Notes, tasks and tracking sheets stay in this browser;
              export/import a backup to move them between devices.
            </span>
            <button
              onClick={() => {
                setView("settings");
                setFocus(null);
                setMobile(false);
              }}
            >
              Backup & restore <ArrowRight size={14} />
            </button>
          </div>
          {view === "overview" && (
            <>
              <div className="hero">
                <div>
                  <div className="eyebrow">
                    <span className="live-dot" />
                    YOUR RESEARCH, IN ONE PLACE
                  </div>
                  <h1>
                    Good to see you back<span className="headline-dot">.</span>
                  </h1>
                  <p>
                    Here's what is happening across your research workspace.
                  </p>
                  <div className="hero-actions">
                    <button className="primary" onClick={() => open("project")}>
                      <Plus size={17} /> New project
                    </button>
                    <button
                      className="secondary"
                      onClick={() => {
                        setView("tasks");
                        setFocus(null);
                      }}
                    >
                      View tasks <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
                <div className="hero-visual">
                  <div className="orb orb-one" />
                  <div className="orb orb-two" />
                  <div className="hero-icon">
                    <FlaskConical size={70} strokeWidth={1.1} />
                  </div>
                  <div className="floating-tag">
                    <span>●</span> WORKSPACE ACTIVE
                  </div>
                </div>
              </div>
              <div className="stats">
                <Stat
                  icon={FolderKanban}
                  label="Total projects"
                  num={db.projects.length}
                  sub="Across your workspace"
                  tint="purple"
                />
                <Stat
                  icon={Activity}
                  label="Active research"
                  num={active}
                  sub="Currently in progress"
                  tint="blue"
                />
                <Stat
                  icon={ListTodo}
                  label="Open tasks"
                  num={totalTasks - complete}
                  sub={`${complete} of ${totalTasks} completed`}
                  tint="orange"
                />
                <Stat
                  icon={BookOpen}
                  label="Literature saved"
                  num={db.papers.length}
                  sub="Research references"
                  tint="green"
                />
              </div>
              <div className="section-heading">
                <div>
                  <h2>Your research projects</h2>
                  <p>Track progress across every paper and study</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setView("projects")}
                >
                  All projects <ArrowRight size={16} />
                </button>
              </div>
              <div className="project-grid">
                {shownProjects.slice(0, 4).map((p) => (
                  <ProjectCard
                    key={p.id}
                    p={p}
                    onClick={() => {
                      setView("projects");
                      setFocus(p.id);
                    }}
                  />
                ))}
              </div>
              <div className="bottom-grid">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h3>Upcoming priorities</h3>
                      <p>Keep your next milestones in sight</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setView("tasks")}
                    >
                      View all <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="priority-list">
                    {upcoming
                      .filter((t) => matches(t.title))
                      .map((t) => (
                        <div key={t.id} className="priority-item">
                          <button
                            className="task-check"
                            title="Mark complete"
                            onClick={() =>
                              patch("tasks", t.id, { status: "Done" })
                            }
                          >
                            <Circle size={20} />
                          </button>
                          <div>
                            <strong>{t.title}</strong>
                            <small>{projectName(t.projectId)}</small>
                          </div>
                          <span className="date-chip">{fmt(t.due)}</span>
                        </div>
                      ))}
                    {upcoming.length === 0 && (
                      <Empty text="No upcoming tasks" />
                    )}
                  </div>
                </section>
                <section className="panel insight-panel">
                  <div className="panel-head">
                    <div>
                      <h3>Workspace pulse</h3>
                      <p>A quick look at your momentum</p>
                    </div>
                    <ChartNoAxesCombined size={19} className="muted" />
                  </div>
                  <div className="donut-wrap">
                    <div
                      className="donut"
                      style={{
                        background: `conic-gradient(#8172f6 ${totalTasks ? (complete / totalTasks) * 100 : 0}%, var(--track) 0)`,
                      }}
                    >
                      <div>
                        <b>
                          {totalTasks
                            ? Math.round((complete / totalTasks) * 100)
                            : 0}
                          %
                        </b>
                        <small>tasks done</small>
                      </div>
                    </div>
                  </div>
                  <div className="insight-row">
                    <span>
                      <i className="legend purple" />
                      Completed tasks
                    </span>
                    <b>{complete}</b>
                  </div>
                  <div className="insight-row">
                    <span>
                      <i className="legend gray" />
                      Still in progress
                    </span>
                    <b>{totalTasks - complete}</b>
                  </div>
                  <div className="insight-note">
                    <Target size={17} /> Small progress, consistently, adds up.
                  </div>
                </section>
              </div>
            </>
          )}
          {view === "projects" && !picked && (
            <>
              <PageTitle
                eyebrow="RESEARCH PORTFOLIO"
                title="Your projects"
                desc="Every paper, one organized workspace."
                action="New project"
                onAction={() => open("project")}
              />
              <div className="toolbar">
                <div className="filter-info">
                  {shownProjects.length} projects in your workspace
                </div>
                <span className="push" />
                <button
                  className="filter-btn"
                  onClick={() =>
                    notify("Use the global search to filter projects")
                  }
                >
                  <Filter size={16} /> Filter
                </button>
              </div>
              <div className="project-grid all-projects">
                {shownProjects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    p={p}
                    onClick={() => setFocus(p.id)}
                  />
                ))}
              </div>
            </>
          )}
          {view === "projects" && picked && (
            <>
              <button className="back-link" onClick={() => setFocus(null)}>
                ← All projects
              </button>
              <div className="project-detail-head">
                <div
                  className="project-emblem"
                  style={{
                    background: picked.color + "20",
                    color: picked.color,
                  }}
                >
                  <FlaskConical size={28} />
                </div>
                <div className="detail-heading">
                  <div className="eyebrow">
                    RESEARCH WORKSPACE{" "}
                    <span> / {picked.phase.toUpperCase()}</span>
                  </div>
                  <h1>{picked.name}</h1>
                  <p>{picked.description}</p>
                </div>
                <button
                  className="secondary"
                  onClick={() => editProject(picked)}
                >
                  <Settings size={15} /> Edit project
                </button>
              </div>
              <div className="detail-stats">
                <div className="mini-stat">
                  <small>PROJECT STATUS</small>
                  <b>
                    <span className="live-dot" />
                    {picked.status}
                  </b>
                </div>
                <div className="mini-stat">
                  <small>OVERALL PROGRESS</small>
                  <b>{picked.progress}%</b>
                </div>
                <div className="mini-stat">
                  <small>DEADLINE</small>
                  <b>{fmt(picked.deadline)}</b>
                </div>
                <div className="mini-stat">
                  <small>ACCESS</small>
                  <b>
                    {picked.visibility === "Shared" ? (
                      <Users size={16} />
                    ) : (
                      <LockKeyhole size={16} />
                    )}{" "}
                    {picked.visibility}
                  </b>
                </div>
              </div>
              <div className="detail-content">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h3>Research objective</h3>
                      <p>What this project is trying to answer</p>
                    </div>
                    <Target size={18} className="muted" />
                  </div>
                  <p className="objective">
                    {picked.goal || "Add a research goal in project settings."}
                  </p>
                  <div className="thin-progress">
                    <div
                      style={{
                        width: `${picked.progress}%`,
                        background: picked.color,
                      }}
                    />
                  </div>
                  <div className="detail-mini">
                    Current stage: <b>{picked.phase}</b>
                    <span className="push" />
                    {picked.progress}%
                  </div>
                </section>
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h3>Project contents</h3>
                      <p>Everything connected to this study</p>
                    </div>
                  </div>
                  <div className="content-tiles">
                    {(
                      [
                        {
                          v: "tasks",
                          label: "Tasks",
                          count: db.tasks.filter(
                            (x) => x.projectId === picked.id,
                          ).length,
                          Icon: ListTodo,
                        },
                        {
                          v: "literature",
                          label: "References",
                          count: db.papers.filter(
                            (x) => x.projectId === picked.id,
                          ).length,
                          Icon: BookOpen,
                        },
                        {
                          v: "assets",
                          label: "Assets",
                          count: db.assets.filter(
                            (x) => x.projectId === picked.id,
                          ).length,
                          Icon: Database,
                        },
                        {
                          v: "notes",
                          label: "Notes",
                          count: db.notes.filter(
                            (x) => x.projectId === picked.id,
                          ).length,
                          Icon: NotebookPen,
                        },
                      ] as const
                    ).map(({ v, label, count, Icon }) => (
                      <button
                        key={v}
                        className="content-tile"
                        onClick={() => {
                          setProject(picked.id);
                          setView(v);
                          setFocus(null);
                        }}
                      >
                        <Icon size={20} />
                        <b>{count}</b>
                        <small>{label}</small>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
              <div className="section-heading">
                <div>
                  <h2>Next steps</h2>
                  <p>Tasks connected to this project</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => open("task", { projectId: picked.id })}
                >
                  <Plus size={15} /> Add task
                </button>
              </div>
              <div className="panel detail-task-list">
                {db.tasks
                  .filter((t) => t.projectId === picked.id)
                  .map((t) => (
                    <div className="priority-item" key={t.id}>
                      <button
                        className="task-check"
                        onClick={() =>
                          patch("tasks", t.id, {
                            status: t.status === "Done" ? "To do" : "Done",
                          })
                        }
                      >
                        {t.status === "Done" ? (
                          <CheckCircle2 size={20} className="success" />
                        ) : (
                          <Circle size={20} />
                        )}
                      </button>
                      <div>
                        <strong
                          style={{
                            textDecoration:
                              t.status === "Done" ? "line-through" : undefined,
                          }}
                        >
                          {t.title}
                        </strong>
                        <small>
                          {t.priority} priority · {t.status}
                        </small>
                      </div>
                      <span className="date-chip">{fmt(t.due)}</span>
                    </div>
                  ))}
                {db.tasks.filter((t) => t.projectId === picked.id).length ===
                  0 && <Empty text="No tasks yet. Add the first next step." />}
              </div>
              <ResearchWorkspace
                key={picked.id}
                project={picked}
                store={db}
                onCreate={(kind, initial) => open(kind, initial)}
                onCreateNote={(n) => mutate("notes", n)}
                onPatchNote={(id, data) => patch("notes", id, data)}
                onPatchPaper={(id, data) => patch("papers", id, data)}
                onDeletePaper={(id) => remove("papers", id)}
                onDeleteNote={(id) => remove("notes", id)}
                onOpenSection={(section, projectId) => {
                  setProject(projectId);
                  setView(section);
                  setFocus(null);
                }}
                onUpdateProject={(id, updates) =>
                  patch("projects", id, updates)
                }
              />
            </>
          )}
          {view === "tasks" && (
            <>
              <PageTitle
                eyebrow="WORK MANAGEMENT"
                title="Task board"
                desc="Stay focused on what moves your research forward."
                action="Add task"
                onAction={() =>
                  open("task", { projectId: project === "all" ? "" : project })
                }
              />
              <div className="toolbar">
                <ProjectFilter
                  projects={db.projects}
                  value={project}
                  onChange={setProject}
                />
                <span className="push" />
                <div className="segmented">
                  <button
                    className={taskMode === "board" ? "on" : ""}
                    onClick={() => setTaskMode("board")}
                  >
                    Board
                  </button>
                  <button
                    className={taskMode === "list" ? "on" : ""}
                    onClick={() => setTaskMode("list")}
                  >
                    List
                  </button>
                </div>
              </div>
              {taskMode === "board" ? (
                <div className="kanban">
                  {(["To do", "In progress", "Done"] as const).map(
                    (status, i) => (
                      <div className="kanban-column" key={status}>
                        <div className="kanban-title">
                          <span className={`kanban-indicator k${i}`} />
                          <h3>{status}</h3>
                          <small>
                            {
                              shownTasks.filter((x) => x.status === status)
                                .length
                            }
                          </small>
                        </div>
                        {shownTasks
                          .filter((t) => t.status === status)
                          .map(cardTask)}
                        <button
                          className="column-add"
                          onClick={() =>
                            open("task", {
                              status,
                              projectId: project === "all" ? "" : project,
                            })
                          }
                        >
                          <Plus size={15} /> Add a task
                        </button>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="panel table-panel">
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Task</th>
                          <th>Project</th>
                          <th>Priority</th>
                          <th>Due</th>
                          <th>Status</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {shownTasks.map((t) => (
                          <tr key={t.id}>
                            <td>
                              <button
                                className="inline-link"
                                onClick={() =>
                                  open(
                                    "task",
                                    Object.fromEntries(
                                      Object.entries(t).map(([k, v]) => [
                                        k,
                                        String(v),
                                      ]),
                                    ),
                                    t.id,
                                  )
                                }
                              >
                                {t.title}
                              </button>
                            </td>
                            <td>{projectName(t.projectId)}</td>
                            <td>
                              <span
                                className={`priority ${t.priority.toLowerCase()}`}
                              >
                                {t.priority}
                              </span>
                            </td>
                            <td>{fmt(t.due)}</td>
                            <td>
                              <select
                                className="inline-select"
                                value={t.status}
                                onChange={(e) =>
                                  patch("tasks", t.id, {
                                    status: e.target.value,
                                  })
                                }
                              >
                                {["To do", "In progress", "Done"].map((s) => (
                                  <option>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <button
                                className="icon-btn"
                                onClick={() => remove("tasks", t.id)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
          {view === "literature" && (
            <>
              <PageTitle
                eyebrow="KNOWLEDGE BASE"
                title="Literature library"
                desc="Turn a reading list into an evidence trail."
                action="Add reference"
                onAction={() =>
                  open("paper", { projectId: project === "all" ? "" : project })
                }
              />
              <div className="toolbar">
                <ProjectFilter
                  projects={db.projects}
                  value={project}
                  onChange={setProject}
                />
                <span className="push" />
                <span className="filter-info">
                  {shownPapers.length} references
                </span>
              </div>
              <LiteratureSheet
                papers={shownPapers}
                projects={db.projects}
                onChange={(id, data) => patch("papers", id, data)}
                onDelete={(id) => remove("papers", id)}
              />
            </>
          )}
          {view === "assets" && (
            <>
              <PageTitle
                eyebrow="RESEARCH RESOURCES"
                title="Assets & data"
                desc="One searchable index for datasets, videos, code, and documents."
                action="Add asset"
                onAction={() =>
                  open("asset", { projectId: project === "all" ? "" : project })
                }
              />
              <div className="notice">
                <Database size={18} />
                <span>
                  Upload files in a project’s Documents vault to save them in
                  Google Drive. This section indexes additional resource links.
                </span>
              </div>
              <div className="toolbar">
                <ProjectFilter
                  projects={db.projects}
                  value={project}
                  onChange={setProject}
                />
                <span className="push" />
                <span className="filter-info">
                  {shownAssets.length} assets indexed
                </span>
              </div>
              <div className="panel resource-list">
                {shownAssets.map((a) => (
                  <div key={a.id} className="resource-row">
                    <div className="resource-icon blue-bg">
                      <FileText size={20} />
                    </div>
                    <div className="resource-main">
                      <h3>{a.name}</h3>
                      <p>
                        {a.kind} · {projectName(a.projectId)}
                      </p>
                      <small>Updated {a.updated}</small>
                    </div>
                    {a.url && (
                      <a
                        title="Open linked asset"
                        className="icon-btn"
                        href={safeUrl(a.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={17} />
                      </a>
                    )}
                    <button
                      className="icon-btn"
                      onClick={() =>
                        open(
                          "asset",
                          Object.fromEntries(
                            Object.entries(a).map(([k, v]) => [k, String(v)]),
                          ),
                          a.id,
                        )
                      }
                    >
                      <Settings size={16} />
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => remove("assets", a.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {shownAssets.length === 0 && (
                  <Empty text="No assets found. Add an important dataset or file link." />
                )}
              </div>
            </>
          )}
          {view === "notes" && (
            <>
              <PageTitle
                eyebrow="RESEARCH THINKING"
                title="Research notes"
                desc="Save decisions, findings, hypotheses, and supervisor feedback."
                action="New note"
                onAction={() =>
                  open("note", { projectId: project === "all" ? "" : project })
                }
              />
              <div className="toolbar">
                <ProjectFilter
                  projects={db.projects}
                  value={project}
                  onChange={setProject}
                />
                <span className="push" />
                <span className="filter-info">{shownNotes.length} notes</span>
              </div>
              <StickyNotes
                notes={shownNotes}
                projects={db.projects}
                projectId={project === "all" ? undefined : project}
                onCreate={(n) => mutate("notes", n)}
                onChange={(id, data) => patch("notes", id, data)}
                onDelete={(id) => remove("notes", id)}
              />
            </>
          )}
          {view === "assistant" && <AIAssistant store={db} />}
          {view === "team" && (
            <>
              <PageTitle
                eyebrow="ACCESS CONTROL"
                title="Collaboration"
                desc="Design selective access around each research project."
                action="Plan collaborator"
                onAction={() => open("member")}
              />
              <div className="notice orange-notice">
                <AlertCircle size={19} />
                <span>
                  <strong>Invitation preview only.</strong> Collaborators listed
                  here are local records. Authentication, email invitations, and
                  real sharing require the Supabase backend integration.
                </span>
              </div>
              <div className="panel resource-list">
                <div className="panel-head team-head">
                  <div>
                    <h3>Project access</h3>
                    <p>
                      Private by default — share projects individually when
                      cloud access is enabled.
                    </p>
                  </div>
                </div>
                {db.projects.map((p) => (
                  <div className="resource-row" key={p.id}>
                    <div
                      className="resource-icon"
                      style={{ background: p.color + "20", color: p.color }}
                    >
                      <Users size={20} />
                    </div>
                    <div className="resource-main">
                      <h3>{p.short}</h3>
                      <p>
                        {p.visibility} ·{" "}
                        {db.members.filter((m) => m.projectId === p.id).length}{" "}
                        planned collaborator(s)
                      </p>
                    </div>
                    <button
                      className="secondary small"
                      onClick={() => editProject(p)}
                    >
                      Manage <ArrowUpRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="section-heading">
                <div>
                  <h2>Planned collaborators</h2>
                  <p>These invitations have not been sent</p>
                </div>
              </div>
              <div className="panel resource-list">
                {db.members.map((m) => (
                  <div className="resource-row" key={m.id}>
                    <div className="avatar small-avatar">
                      {m.email[0].toUpperCase()}
                    </div>
                    <div className="resource-main">
                      <h3>{m.email}</h3>
                      <p>
                        {projectName(m.projectId)} · {m.role} · {m.status}
                      </p>
                    </div>
                    <button
                      className="icon-btn"
                      onClick={() => remove("members", m.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {db.members.length === 0 && (
                  <Empty text="No collaborators planned yet." />
                )}
              </div>
            </>
          )}
          {view === "settings" && (
            <>
              <PageTitle
                eyebrow="PREFERENCES & DATA"
                title="Workspace settings"
                desc="Control how your local workspace is saved and backed up."
              />
              <div className="settings-grid">
                {connection}
                <section className="panel settings-panel">
                  <div className="settings-icon">
                    <Download size={22} />
                  </div>
                  <h3>Backup your research workspace</h3>
                  <p>
                    Download projects, tasks, references, notes, asset links,
                    collaborators, and stage checklists as JSON. Uploaded
                    document contents are not included; keep originals
                    separately.
                  </p>
                  <button className="primary" onClick={exportData}>
                    <Download size={17} /> Export backup
                  </button>
                </section>
                <section className="panel settings-panel">
                  <div className="settings-icon">
                    <Upload size={22} />
                  </div>
                  <h3>Restore a backup</h3>
                  <p>
                    Import a previously exported ResearchOS JSON backup. This
                    replaces the data currently saved in this browser.
                  </p>
                  <label className="secondary file-label">
                    <Upload size={16} /> Import backup
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={(e) => {
                        if (e.target.files?.[0]) importData(e.target.files[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </section>
                <section className="panel settings-panel">
                  <div className="settings-icon">
                    <ShieldCheck size={22} />
                  </div>
                  <h3>Privacy & storage</h3>
                  <p>
                    Notes, tasks and project records save in this browser.
                    Confirmed uploads are in Google Drive; pending files have
                    only a browser copy. Export regular JSON backups and keep
                    pending files until upload succeeds.
                  </p>
                  <div className="system-pill">
                    <span className="live-dot" /> Local records + private Drive
                    files
                  </div>
                </section>
                <section className="panel settings-panel">
                  <div className="settings-icon">
                    <RefreshCcw size={22} />
                  </div>
                  <h3>Reset demo workspace</h3>
                  <p>
                    Restore the six example research projects and their demo
                    resources. Current records and stage checklists will be
                    overwritten. Uploaded document copies are kept in this
                    browser.
                  </p>
                  <button
                    className="danger-button"
                    onClick={() => {
                      if (
                        confirm(
                          "Reset all local workspace data to demo content?",
                        )
                      ) {
                        clearWorkflows(
                          [...db.projects, ...seed.projects].map((p) => p.id),
                        );
                        setDb(structuredClone(seed));
                        setProject("all");
                        notify("Demo workspace reset");
                      }
                    }}
                  >
                    Reset demo data
                  </button>
                </section>
              </div>
            </>
          )}
        </main>
      </div>
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-head">
              <div>
                <div className="eyebrow">RESEARCHOS WORKSPACE</div>
                <h2 id="modal-title">
                  {editing ? "Edit " : "Add "}
                  {
                    (
                      {
                        project: "project",
                        task: "task",
                        paper: "reference",
                        asset: "asset",
                        note: "note",
                        member: "planned collaborator",
                      } as any
                    )[modal]
                  }
                </h2>
              </div>
              <button
                className="icon-btn"
                aria-label="Close dialog"
                onClick={() => setModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <div className="modal-body">
                {modal === "project" && (
                  <>
                    <Field
                      label="Project name"
                      value={form.name}
                      onChange={(v) => setForm({ ...form, name: v })}
                      required
                      placeholder="e.g. Urban Traffic Delay Study"
                    />
                    <Field
                      label="Description"
                      value={form.description}
                      onChange={(v) => setForm({ ...form, description: v })}
                      textarea
                      placeholder="What is this research about?"
                    />
                    <Field
                      label="Research objective"
                      value={form.goal}
                      onChange={(v) => setForm({ ...form, goal: v })}
                      textarea
                    />
                    <div className="form-grid">
                      <SelectField
                        label="Status"
                        value={form.status || "Idea"}
                        options={[
                          "Idea",
                          "Planning",
                          "In progress",
                          "Review",
                          "Submitted",
                          "Published",
                        ]}
                        onChange={(v) => setForm({ ...form, status: v })}
                      />
                      <Field
                        label="Research phase"
                        value={form.phase}
                        onChange={(v) => setForm({ ...form, phase: v })}
                        placeholder="e.g. Data collection"
                      />
                    </div>
                    <div className="form-grid">
                      <Field
                        label="Progress (0–100)"
                        type="number"
                        value={form.progress || "0"}
                        onChange={(v) =>
                          setForm({
                            ...form,
                            progress: String(
                              Math.min(100, Math.max(0, Number(v))),
                            ),
                          })
                        }
                      />
                      <Field
                        label="Target deadline"
                        type="date"
                        value={form.deadline}
                        onChange={(v) => setForm({ ...form, deadline: v })}
                      />
                    </div>
                    <SelectField
                      label="Workspace visibility"
                      value={form.visibility || "Private"}
                      options={["Private", "Shared"]}
                      onChange={(v) => setForm({ ...form, visibility: v })}
                    />
                    <small className="form-hint">
                      This label does not change Google Drive sharing
                      permissions. Files created by ResearchOS remain private by
                      default.
                    </small>
                  </>
                )}
                {modal === "project" && (
                  <label className="field">
                    <span>Research proposal file (optional)</span>
                    <input
                      type="file"
                      aria-label="Research proposal file (optional)"
                      accept=".pdf,.doc,.docx,.txt,.md"
                      onChange={(e) => setProposal(e.target.files?.[0] || null)}
                    />
                    <small>
                      Saved in this project’s Research Proposal folder in Google
                      Drive. Maximum 50 MB.
                    </small>
                  </label>
                )}
                {modal === "task" && (
                  <>
                    <Field
                      label="Task title"
                      value={form.title}
                      onChange={(v) => setForm({ ...form, title: v })}
                      required
                      placeholder="What needs to get done?"
                    />
                    <ProjectField
                      projects={db.projects}
                      value={form.projectId || db.projects[0]?.id}
                      onChange={(v) => setForm({ ...form, projectId: v })}
                    />
                    <div className="form-grid">
                      <SelectField
                        label="Status"
                        options={["To do", "In progress", "Done"]}
                        value={form.status || "To do"}
                        onChange={(v) => setForm({ ...form, status: v })}
                      />
                      <SelectField
                        label="Priority"
                        options={["High", "Medium", "Low"]}
                        value={form.priority || "Medium"}
                        onChange={(v) => setForm({ ...form, priority: v })}
                      />
                    </div>
                    <div className="form-grid">
                      <Field
                        label="Due date"
                        type="date"
                        value={form.due}
                        onChange={(v) => setForm({ ...form, due: v })}
                      />
                      <Field
                        label="Assignee"
                        value={form.assignee || "Me"}
                        onChange={(v) => setForm({ ...form, assignee: v })}
                      />
                    </div>
                  </>
                )}
                {modal === "paper" && (
                  <>
                    <Field
                      label="Paper / reference title"
                      value={form.title}
                      onChange={(v) => setForm({ ...form, title: v })}
                      required
                    />
                    <ProjectField
                      projects={db.projects}
                      value={form.projectId || db.projects[0]?.id}
                      onChange={(v) => setForm({ ...form, projectId: v })}
                    />
                    <div className="form-grid">
                      <Field
                        label="Authors"
                        value={form.authors}
                        onChange={(v) => setForm({ ...form, authors: v })}
                      />
                      <Field
                        label="Year"
                        value={form.year}
                        onChange={(v) => setForm({ ...form, year: v })}
                      />
                    </div>
                    <Field
                      label="DOI"
                      value={form.doi}
                      onChange={(v) => setForm({ ...form, doi: v })}
                      placeholder="10.xxxx/..."
                    />
                    <Field
                      label="Source URL"
                      type="url"
                      value={form.url}
                      onChange={(v) => setForm({ ...form, url: v })}
                      placeholder="https://..."
                    />
                    <SelectField
                      label="Reading status"
                      options={["To read", "Reading", "Reviewed"]}
                      value={form.status || "To read"}
                      onChange={(v) => setForm({ ...form, status: v })}
                    />
                    <Field
                      label="Additional notes"
                      textarea
                      value={form.notes}
                      onChange={(v) => setForm({ ...form, notes: v })}
                    />
                  </>
                )}
                {modal === "paper" &&
                  (
                    [
                      ["abstractSummary", "Abstract summary"],
                      ["gap", "Research gap"],
                      ["methods", "Methods"],
                      ["findings", "Key findings"],
                      ["relevance", "Relevance"],
                    ] as const
                  ).map(([key, label]) => (
                    <Field
                      key={key}
                      label={label}
                      textarea
                      value={form[key]}
                      onChange={(v) => setForm({ ...form, [key]: v })}
                    />
                  ))}
                {modal === "asset" && (
                  <>
                    <Field
                      label="Asset name"
                      value={form.name}
                      onChange={(v) => setForm({ ...form, name: v })}
                      required
                    />
                    <ProjectField
                      projects={db.projects}
                      value={form.projectId || db.projects[0]?.id}
                      onChange={(v) => setForm({ ...form, projectId: v })}
                    />
                    <SelectField
                      label="Asset type"
                      options={[
                        "Video folder",
                        "Spreadsheet",
                        "Dataset",
                        "Document",
                        "Code repository",
                        "Model weights",
                        "Presentation",
                        "Link",
                        "Other",
                      ]}
                      value={form.kind || "Link"}
                      onChange={(v) => setForm({ ...form, kind: v })}
                    />
                    <Field
                      label="Drive / GitHub / file URL"
                      type="url"
                      value={form.url}
                      onChange={(v) => setForm({ ...form, url: v })}
                      placeholder="https://..."
                    />
                    <small className="form-hint">
                      Only a link is stored; files are not uploaded to this
                      demo.
                    </small>
                  </>
                )}
                {modal === "note" && (
                  <>
                    <Field
                      label="Note title"
                      value={form.title}
                      onChange={(v) => setForm({ ...form, title: v })}
                      required
                    />
                    <ProjectField
                      projects={db.projects}
                      value={form.projectId || db.projects[0]?.id}
                      onChange={(v) => setForm({ ...form, projectId: v })}
                    />
                    <Field
                      label="Notes"
                      textarea
                      large
                      value={form.body}
                      onChange={(v) => setForm({ ...form, body: v })}
                      placeholder="Ideas, decisions, supervisor feedback..."
                    />
                  </>
                )}
                {modal === "member" && (
                  <>
                    <ProjectField
                      projects={db.projects}
                      value={form.projectId || db.projects[0]?.id}
                      onChange={(v) => setForm({ ...form, projectId: v })}
                    />
                    <Field
                      label="Collaborator email"
                      type="email"
                      value={form.email}
                      onChange={(v) => setForm({ ...form, email: v })}
                      required
                      placeholder="teammate@university.edu"
                    />
                    <SelectField
                      label="Planned role"
                      options={["Viewer", "Editor"]}
                      value={form.role || "Viewer"}
                      onChange={(v) => setForm({ ...form, role: v })}
                    />
                    <div className="notice orange-notice">
                      <AlertCircle size={16} />
                      This records an invitation plan only; no invite is sent
                      and no real access is granted.
                    </div>
                  </>
                )}
              </div>
              <div className="modal-foot">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={saving}>
                  <Check size={16} />
                  {editing ? "Save changes" : "Save to workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
function Stat({ icon: Icon, label, num, sub, tint }: any) {
  return (
    <div className="stat">
      <div className={`stat-icon ${tint}`}>
        <Icon size={20} />
      </div>
      <span>{label}</span>
      <strong>{nl(num)}</strong>
      <small>{sub}</small>
    </div>
  );
}
function ProjectCard({ p, onClick }: { p: Project; onClick: () => void }) {
  return (
    <button className="project-card" onClick={onClick}>
      <div className="project-card-top">
        <div
          className="project-icon"
          style={{ background: p.color + "1b", color: p.color }}
        >
          <FlaskConical size={23} />
        </div>
        <span
          className={`status-pill ${p.status === "Review" ? "review" : ""}`}
        >
          <span className="tiny-dot" />
          {p.status}
        </span>
      </div>
      <h3>{p.name}</h3>
      <p>{p.description}</p>
      <div className="project-meta">
        <span>
          <CalendarDays size={13} />
          {fmt(p.deadline)}
        </span>
        <span>
          {p.visibility === "Shared" ? (
            <Users size={14} />
          ) : (
            <LockKeyhole size={13} />
          )}{" "}
          {p.visibility}
        </span>
      </div>
      <div className="card-progress-label">
        <span>Progress</span>
        <b>{p.progress}%</b>
      </div>
      <div className="thin-progress">
        <div style={{ width: `${p.progress}%`, background: p.color }} />
      </div>
      <div className="card-footer">
        <span>{p.phase}</span>
        <ArrowUpRight size={18} />
      </div>
    </button>
  );
}
function PageTitle({
  eyebrow,
  title,
  desc,
  action,
  onAction,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>
          {title}
          <span className="headline-dot">.</span>
        </h1>
        <p>{desc}</p>
      </div>
      {action && (
        <button className="primary" onClick={onAction}>
          <Plus size={17} />
          {action}
        </button>
      )}
    </div>
  );
}
function ProjectFilter({
  projects,
  value,
  onChange,
}: {
  projects: Project[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="project-filter">
      <Filter size={16} />
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="all">All projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.short}
          </option>
        ))}
      </select>
      <ChevronDown size={14} />
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  textarea = false,
  large = false,
  required = false,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  large?: boolean;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {textarea ? (
        <textarea
          rows={large ? 7 : 3}
          required={required}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          required={required}
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}
function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
    </label>
  );
}
function ProjectField({
  projects,
  value,
  onChange,
}: {
  projects: Project[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      <span>Research project</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <Archive size={24} />
      <p>{text}</p>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <AdminGate>
    <GoogleGate>
      <App />
    </GoogleGate>
  </AdminGate>,
);
