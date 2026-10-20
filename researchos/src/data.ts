import { parseBackup } from "./storage";
export type Status =
  | "Idea"
  | "Planning"
  | "In progress"
  | "Review"
  | "Submitted"
  | "Published";
export type Priority = "High" | "Medium" | "Low";
export interface Project {
  id: string;
  name: string;
  short: string;
  description: string;
  status: Status;
  phase: string;
  progress: number;
  color: string;
  icon: string;
  updated: string;
  deadline: string;
  members: number;
  visibility: "Private" | "Shared";
  goal: string;
}
export interface Task {
  id: string;
  projectId: string;
  title: string;
  status: "To do" | "In progress" | "Done";
  priority: Priority;
  due: string;
  assignee: string;
}
export interface Paper {
  id: string;
  projectId: string;
  title: string;
  authors: string;
  year: string;
  doi: string;
  status: "To read" | "Reading" | "Reviewed";
  notes: string;
  url: string;
  abstractSummary?: string;
  gap?: string;
  methods?: string;
  findings?: string;
  relevance?: string;
}
export interface Asset {
  id: string;
  projectId: string;
  name: string;
  kind: string;
  url: string;
  updated: string;
}
export interface Note {
  id: string;
  projectId: string;
  title: string;
  body: string;
  updated: string;
  color?: "yellow" | "mint" | "pink" | "violet";
  pinned?: boolean;
}
export interface Member {
  id: string;
  projectId: string;
  email: string;
  role: "Viewer" | "Editor";
  status: "Planned invite" | "Active";
}
export interface Store {
  projects: Project[];
  tasks: Task[];
  papers: Paper[];
  assets: Asset[];
  notes: Note[];
  members: Member[];
}
export const seed: Store = {
  projects: [
    {
      id: "pudo",
      name: "Rickshaw PUDO & Corridor Delay",
      short: "Rickshaw PUDO",
      description:
        "Quantifying curbside stopping behavior, dwell time, and corridor delay in heterogeneous traffic.",
      status: "In progress",
      phase: "Data analysis",
      progress: 68,
      color: "#7769ec",
      icon: "car",
      updated: "Oct 19",
      deadline: "2026-11-12",
      members: 1,
      visibility: "Private",
      goal: "Validate event-level stopping behavior and produce a reproducible delay analysis.",
    },
    {
      id: "lateral",
      name: "Lateral Movement in Mixed Traffic",
      short: "Lateral Movement",
      description:
        "Investigating lateral shifts and resulting operational effects in non-lane-based traffic.",
      status: "Planning",
      phase: "Literature review",
      progress: 32,
      color: "#40a6d9",
      icon: "route",
      updated: "Oct 18",
      deadline: "2026-12-05",
      members: 3,
      visibility: "Shared",
      goal: "Determine the most defensible research question and measurement strategy.",
    },
    {
      id: "emergency",
      name: "Emergency Vehicle Accessibility",
      short: "Emergency Access",
      description:
        "Examining mismatch between routine road performance and emergency-vehicle maneuverability.",
      status: "Planning",
      phase: "Methodology design",
      progress: 24,
      color: "#e6a257",
      icon: "activity",
      updated: "Oct 16",
      deadline: "2026-12-20",
      members: 1,
      visibility: "Private",
      goal: "Develop a feasible data collection and validation plan.",
    },
    {
      id: "rcdw",
      name: "RCDW Environmental Impacts",
      short: "RCDW Impacts",
      description:
        "Survey-based study of road construction and demolition waste impacts and management.",
      status: "Review",
      phase: "Manuscript writing",
      progress: 79,
      color: "#52b79d",
      icon: "leaf",
      updated: "Oct 17",
      deadline: "2026-11-20",
      members: 2,
      visibility: "Shared",
      goal: "Finalize tables and draft a submission-ready manuscript.",
    },
    {
      id: "new5",
      name: "Traffic-State Discovery",
      short: "Traffic State",
      description:
        "Exploratory methods for characterizing complex urban traffic interactions.",
      status: "Idea",
      phase: "Concept exploration",
      progress: 8,
      color: "#cf80b4",
      icon: "layers",
      updated: "Oct 12",
      deadline: "",
      members: 1,
      visibility: "Private",
      goal: "Assess feasibility and research novelty.",
    },
    {
      id: "new6",
      name: "Road Safety & Computer Vision",
      short: "Road Safety CV",
      description:
        "Potential study leveraging trajectory and detection outputs to assess road safety.",
      status: "Idea",
      phase: "Concept exploration",
      progress: 5,
      color: "#e48f7d",
      icon: "shield",
      updated: "Oct 10",
      deadline: "",
      members: 1,
      visibility: "Private",
      goal: "Identify a tractable, publication-oriented research direction.",
    },
  ],
  tasks: [
    {
      id: "t1",
      projectId: "pudo",
      title: "Validate stop events against manual ground truth",
      status: "In progress",
      priority: "High",
      due: "2026-10-24",
      assignee: "Me",
    },
    {
      id: "t2",
      projectId: "pudo",
      title: "Compare hospital and supershop dwell distributions",
      status: "To do",
      priority: "High",
      due: "2026-10-26",
      assignee: "Me",
    },
    {
      id: "t3",
      projectId: "lateral",
      title: "Build literature gap comparison matrix",
      status: "In progress",
      priority: "High",
      due: "2026-10-23",
      assignee: "Me",
    },
    {
      id: "t4",
      projectId: "emergency",
      title: "Finalize intersection selection criteria",
      status: "To do",
      priority: "Medium",
      due: "2026-10-29",
      assignee: "Me",
    },
    {
      id: "t5",
      projectId: "rcdw",
      title: "Check manuscript tables against source dataset",
      status: "In progress",
      priority: "High",
      due: "2026-10-25",
      assignee: "Me",
    },
    {
      id: "t6",
      projectId: "rcdw",
      title: "Prepare revised introduction section",
      status: "Done",
      priority: "Medium",
      due: "2026-10-18",
      assignee: "Me",
    },
    {
      id: "t7",
      projectId: "lateral",
      title: "Define measurable lateral shift events",
      status: "To do",
      priority: "Medium",
      due: "2026-11-02",
      assignee: "Me",
    },
    {
      id: "t8",
      projectId: "pudo",
      title: "Archive video annotations and model outputs",
      status: "Done",
      priority: "Low",
      due: "2026-10-17",
      assignee: "Me",
    },
  ],
  papers: [
    {
      id: "r1",
      projectId: "pudo",
      title: "PUDO dwell-time modeling — reference to verify",
      authors: "Add authors",
      year: "2023",
      doi: "",
      status: "Reading",
      notes: "Summarize hazard-based dwell-time methods and relevance.",
      url: "",
    },
    {
      id: "r2",
      projectId: "lateral",
      title: "Generalized lateral shift definition — reference to verify",
      authors: "Add authors",
      year: "",
      doi: "",
      status: "To read",
      notes: "Compare subject vehicle and leader-relative definitions.",
      url: "",
    },
    {
      id: "r3",
      projectId: "emergency",
      title: "Emergency accessibility literature collection",
      authors: "Reading list",
      year: "",
      doi: "",
      status: "To read",
      notes: "Find measures beyond average travel speed.",
      url: "",
    },
  ],
  assets: [
    {
      id: "a1",
      projectId: "pudo",
      name: "Alok Hospital video recordings",
      kind: "Video folder",
      url: "",
      updated: "Oct 19",
    },
    {
      id: "a2",
      projectId: "pudo",
      name: "PUDO event validation dataset",
      kind: "Spreadsheet",
      url: "",
      updated: "Oct 19",
    },
    {
      id: "a3",
      projectId: "lateral",
      name: "Lateral shift literature matrix",
      kind: "Document",
      url: "",
      updated: "Oct 18",
    },
    {
      id: "a4",
      projectId: "rcdw",
      name: "RCDW questionnaire and responses",
      kind: "Spreadsheet",
      url: "",
      updated: "Oct 17",
    },
  ],
  notes: [
    {
      id: "n1",
      projectId: "pudo",
      title: "Key methodological decision",
      body: "Separate passenger-related dwell from other stationary waiting events. Validate stop classifications against manual labels before reporting model performance.",
      updated: "Oct 19",
    },
    {
      id: "n2",
      projectId: "lateral",
      title: "Open research question",
      body: "Should we measure delay caused by lateral shifts, or explore a broader lateral interaction indicator? Compare novelty and practical data requirements.",
      updated: "Oct 18",
    },
  ],
  members: [
    {
      id: "m1",
      projectId: "lateral",
      email: "teammate@example.com",
      role: "Editor",
      status: "Planned invite",
    },
  ],
};
export const storageKey = "researchos-mvp-v1";
export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return parseBackup(raw).store;
  } catch {}
  return structuredClone(seed);
}
export const uid = () => Math.random().toString(36).slice(2, 10);
export const today = () => new Date().toISOString().slice(0, 10);
