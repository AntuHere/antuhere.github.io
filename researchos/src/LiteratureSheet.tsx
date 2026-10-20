import { Download, ExternalLink, Trash2 } from "lucide-react";
import { type Paper, type Project } from "./data";
import { safeUrl } from "./storage";

type Props = {
  papers: Paper[];
  projects: Project[];
  onChange: (id: string, changes: Partial<Paper>) => void;
  onDelete: (id: string) => void;
};
const columns: [keyof Paper, string][] = [
  ["title", "Paper title"],
  ["abstractSummary", "Abstract summary"],
  ["doi", "DOI number"],
  ["gap", "Research gap"],
  ["methods", "Methods"],
  ["findings", "Key findings"],
  ["relevance", "Relevance / next steps"],
  ["authors", "Authors"],
  ["year", "Year"],
  ["notes", "More notes"],
];
export default function LiteratureSheet({
  papers,
  projects,
  onChange,
  onDelete,
}: Props) {
  const exportCSV = () => {
    // Prevent spreadsheet formula execution when a user opens the CSV in Excel.
    const cell = (value: string) =>
      '"' +
      (/^[=+@\-\t\r]/.test(value) ? "'" + value : value).replace(/"/g, '""') +
      '"';
    const rows = [
      ["Project", ...columns.map((c) => c[1]), "Reading status"],
      ...papers.map((p) => [
        projects.find((x) => x.id === p.projectId)?.name || "",
        ...columns.map(([key]) => String(p[key] || "")),
        p.status,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["\ufeff" + rows.map((row) => row.map(cell).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "researchos-paper-tracker.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="paper-sheet">
      <div className="sticky-toolbar">
        <span>Edit cells directly. Changes save automatically.</span>
        <button className="secondary" onClick={exportCSV}>
          <Download size={16} />
          Export sheet
        </button>
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        aria-label="Scrollable paper tracking sheet"
      >
        <table>
          <thead>
            <tr>
              <th>Project</th>
              {columns.map(([, label]) => (
                <th key={label}>{label}</th>
              ))}
              <th>Reading status</th>
              <th>Open</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {papers.map((p) => (
              <tr key={p.id}>
                <td>
                  <select
                    aria-label="Paper project"
                    value={p.projectId}
                    onChange={(e) =>
                      onChange(p.id, { projectId: e.target.value })
                    }
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.short}
                      </option>
                    ))}
                  </select>
                </td>
                {columns.map(([key, label]) => (
                  <td key={key}>
                    <textarea
                      aria-label={label}
                      value={String(p[key] || "")}
                      onChange={(e) =>
                        onChange(p.id, { [key]: e.target.value })
                      }
                      rows={key === "title" ? 3 : 4}
                    />
                  </td>
                ))}
                <td>
                  <select
                    aria-label="Paper reading status"
                    value={p.status}
                    onChange={(e) =>
                      onChange(p.id, {
                        status: e.target.value as Paper["status"],
                      })
                    }
                  >
                    {["To read", "Reading", "Reviewed"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td>
                  {safeUrl(
                    p.url || (p.doi ? "https://doi.org/" + p.doi : ""),
                  ) && (
                    <a
                      href={safeUrl(p.url || "https://doi.org/" + p.doi)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open paper"
                    >
                      <ExternalLink size={17} />
                    </a>
                  )}
                </td>
                <td>
                  <button
                    className="icon-btn"
                    aria-label="Delete paper"
                    onClick={() => onDelete(p.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!papers.length && (
        <p className="empty">
          Add a reference to start your paper-tracking sheet.
        </p>
      )}
    </section>
  );
}
