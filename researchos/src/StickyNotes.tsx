import { Pin, Plus, Trash2 } from "lucide-react";
import { type Note, type Project, today, uid } from "./data";

type Props = {
  notes: Note[];
  projects: Project[];
  projectId?: string;
  onCreate: (note: Note) => void;
  onChange: (id: string, changes: Partial<Note>) => void;
  onDelete: (id: string) => void;
};
export default function StickyNotes({
  notes,
  projects,
  projectId,
  onCreate,
  onChange,
  onDelete,
}: Props) {
  const add = () =>
    onCreate({
      id: uid(),
      projectId:
        !projectId || projectId === "all" ? projects[0]?.id || "" : projectId,
      title: "",
      body: "",
      updated: today(),
      color: "yellow",
      pinned: false,
    });
  return (
    <section className="sticky-board" aria-label="Sticky notes">
      <div className="sticky-toolbar">
        <span>Click a note and start writing. Changes save automatically.</span>
        <button className="primary" onClick={add} disabled={!projects.length}>
          <Plus size={16} />
          Quick sticky note
        </button>
      </div>
      {!projects.length && <p>Create a project before adding notes.</p>}
      <div className="sticky-grid">
        {[...notes]
          .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))
          .map((note) => (
            <article
              key={note.id}
              className={`sticky-note sticky-${note.color || "yellow"}`}
            >
              <div className="sticky-controls">
                <select
                  aria-label="Note project"
                  value={note.projectId}
                  onChange={(e) =>
                    onChange(note.id, { projectId: e.target.value })
                  }
                >
                  {projects.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.short}
                    </option>
                  ))}
                </select>
                <button
                  aria-label={note.pinned ? "Unpin note" : "Pin note"}
                  aria-pressed={Boolean(note.pinned)}
                  onClick={() => onChange(note.id, { pinned: !note.pinned })}
                >
                  <Pin size={16} />
                </button>
                <button
                  aria-label="Delete sticky note"
                  onClick={() => onDelete(note.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <input
                className="sticky-title"
                aria-label="Sticky note title"
                placeholder="Untitled note"
                value={note.title}
                onChange={(e) =>
                  onChange(note.id, { title: e.target.value, updated: today() })
                }
              />
              <textarea
                aria-label="Sticky note text"
                placeholder="An idea, a question, a finding…"
                value={note.body}
                onChange={(e) =>
                  onChange(note.id, { body: e.target.value, updated: today() })
                }
              />
              <div className="sticky-footer">
                <select
                  aria-label="Note color"
                  value={note.color || "yellow"}
                  onChange={(e) =>
                    onChange(note.id, {
                      color: e.target.value as Note["color"],
                    })
                  }
                >
                  {["yellow", "mint", "pink", "violet"].map((color) => (
                    <option key={color}>{color}</option>
                  ))}
                </select>
                <small>{note.updated}</small>
              </div>
            </article>
          ))}
      </div>
      {!notes.length && (
        <p className="empty">
          No notes here yet. Add a sticky note to capture your next idea.
        </p>
      )}
    </section>
  );
}
