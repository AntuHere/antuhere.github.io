import { useEffect, useState } from "react";
import { unzipSync, strFromU8 } from "fflate";
import { CATEGORIES, type Category, type DriveFile } from "./drive";
import { useGoogle } from "./GoogleGate";
import {
  getVault,
  stageFile,
  syncFile,
  deleteVault,
  type VaultRecord,
} from "./vault";
import type { Project, Asset } from "./data";
import { safeUrl } from "./storage";
import { useModalFocus } from "./useModalFocus";

type Remote = DriveFile & { category: Category };
export default function DocumentsVault({
  project,
  links,
  onAddLink,
}: {
  project: Project;
  links: Asset[];
  onAddLink: () => void;
}) {
  const { drive } = useGoogle();
  const [local, setLocal] = useState<VaultRecord[]>([]),
    [remote, setRemote] = useState<Remote[]>([]),
    [category, setCategory] = useState<Category>("Papers"),
    [filter, setFilter] = useState("All"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [folder, setFolder] = useState("");
  const [preview, setPreview] = useState<{
    name: string;
    url: string;
    text?: string;
    pdf: boolean;
  } | null>(null);
  useModalFocus(Boolean(preview), () => setPreview(null));
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );
  const loadLocal = async () =>
    setLocal((await getVault()).filter((x) => x.projectId === project.id));
  const loadDrive = async () => {
    const f = await drive.ensureProject(project);
    setFolder("https://drive.google.com/drive/folders/" + f.id);
    const documents = await drive.documents(project);
    await loadLocal();
    setRemote(documents);
  };
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const records = await getVault();
        if (active) setLocal(records.filter((x) => x.projectId === project.id));
        await loadDrive();
      } catch (e) {
        if (active) setError(String((e as Error).message));
      }
    })();
    return () => {
      active = false;
    };
  }, [project.id, drive]);
  const run = async (job: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await job();
    } catch (e) {
      setError(
        (e as Error).message ||
          "Could not complete the operation. Your pending browser files are retained.",
      );
    } finally {
      await loadLocal().catch(() => {});
      setBusy(false);
    }
  };
  const upload = async (files: File[]) =>
    run(async () => {
      const records: VaultRecord[] = [];
      for (const file of files)
        records.push(await stageFile(project, category, file));
      await loadLocal();
      const failures: string[] = [];
      for (const record of records) {
        try {
          await syncFile(drive, project, record);
        } catch (e) {
          failures.push(record.name + ": " + (e as Error).message);
        }
      }
      if (failures.length) throw Error(failures.join("; "));
      await loadDrive();
    });
  const pending = local.filter((x) => !x.driveId);
  const items = [
    ...remote.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      remote: r,
      local: local.find(
        (l) =>
          l.driveId === r.id || r.appProperties?.researchosDocumentId === l.id,
      ),
    })),
    ...local
      .filter(
        (l) =>
          !remote.some(
            (r) =>
              r.id === l.driveId ||
              r.appProperties?.researchosDocumentId === l.id,
          ),
      )
      .map((l) => ({
        id: l.id,
        name: l.name,
        category: l.category || "Other",
        local: l,
        remote: undefined as Remote | undefined,
      })),
  ].filter((x) => filter === "All" || x.category === filter);
  const open = async (item: (typeof items)[number], download = false) =>
    run(async () => {
      const blob = item.local?.file || (await drive.download(item.remote!.id));
      const url = URL.createObjectURL(blob);
      if (download) {
        const a = document.createElement("a");
        a.href = url;
        a.download = item.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }
      let text: string | undefined;
      if (/\.docx$/i.test(item.name)) {
        try {
          const zip = unzipSync(new Uint8Array(await blob.arrayBuffer()), {
            filter: (f) => {
              if (
                f.name === "word/document.xml" &&
                f.originalSize > 8 * 1024 * 1024
              )
                throw Error("Document too large for text preview.");
              return f.name === "word/document.xml";
            },
          });
          const xml = zip["word/document.xml"];
          if (!xml) throw Error("Missing document text.");
          const source = strFromU8(xml);
          if (/<!DOCTYPE/i.test(source))
            throw Error("Unsupported document XML.");
          const parsed = new DOMParser().parseFromString(
            source,
            "application/xml",
          );
          if (parsed.querySelector("parsererror"))
            throw Error("Invalid document.");
          text = Array.from(parsed.getElementsByTagNameNS("*", "p"))
            .map((p) =>
              Array.from(p.getElementsByTagNameNS("*", "t"))
                .map((t) => t.textContent || "")
                .join(""),
            )
            .join("\n\n");
        } catch (e) {
          URL.revokeObjectURL(url);
          throw e;
        }
      } else if (
        /\.(txt|md|csv|json)$/i.test(item.name) &&
        blob.size < 2 * 1024 * 1024
      )
        text = await blob.text();
      setPreview({
        name: item.name,
        url,
        text,
        pdf: /\.pdf$/i.test(item.name),
      });
    });
  return (
    <div className="rw-pane">
      <div className="rw-section-heading">
        <div>
          <h3>Research documents & files</h3>
          <p>Private Google Drive files, organized by project and category.</p>
        </div>
        <div className="rw-actions">
          {folder && (
            <a
              className="rw-button"
              href={folder}
              target="_blank"
              rel="noreferrer"
            >
              Open project in Drive
            </a>
          )}
          <button
            className="rw-button"
            disabled={busy}
            onClick={() => void run(loadDrive)}
          >
            Refresh Drive
          </button>
          <button className="rw-button" onClick={onAddLink}>
            Add Drive link
          </button>
        </div>
      </div>
      <div className="vault-upload">
        <label>
          Upload category
          <select
            aria-label="Upload category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="rw-button primary">
          {busy ? "Working…" : "Upload files"}
          <input
            aria-label="Upload files"
            type="file"
            multiple
            disabled={busy}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              e.target.value = "";
              void upload(files);
            }}
          />
        </label>
      </div>
      <p className="form-hint">
        Uploads first save a recovery copy in this browser. Pending files need a
        retry; they are not in Drive yet. JSON backups contain notes and project
        records, not file contents.
      </p>
      {error && (
        <div className="rw-error" role="alert">
          {error}
        </div>
      )}
      {pending.length > 0 && (
        <div className="rw-caution">
          {pending.length} pending upload(s).{" "}
          <button
            className="rw-button"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                for (const r of pending) await syncFile(drive, project, r);
                await loadDrive();
              })
            }
          >
            Retry pending uploads
          </button>
        </div>
      )}
      <label>
        Show category
        <select
          aria-label="Show category"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["All", ...CATEGORIES].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <div className="rw-files">
        {items.map((item) => (
          <div className="rw-file" key={item.id}>
            <div className="rw-file-info">
              <b>{item.name}</b>
              <small>
                {item.category} ·{" "}
                {item.local && !item.local.driveId && !item.remote
                  ? "Pending upload"
                  : "Saved in Drive"}
              </small>
            </div>
            <button
              disabled={busy}
              aria-label="Open file"
              title="Open file"
              onClick={() => void open(item)}
            >
              Open
            </button>
            <button
              disabled={busy}
              aria-label="Download file"
              title="Download file"
              onClick={() => void open(item, true)}
            >
              Download
            </button>
            {(item.remote?.id || item.local?.driveId) && (
              <a
                href={safeUrl(
                  item.remote?.webViewLink ||
                    item.local?.driveUrl ||
                    "https://drive.google.com/file/d/" +
                      (item.remote?.id || item.local?.driveId) +
                      "/view",
                )}
                target="_blank"
                rel="noreferrer"
              >
                Drive
              </a>
            )}
            {item.local && (
              <button
                disabled={busy}
                title="Remove browser copy"
                onClick={() => {
                  if (
                    confirm(
                      item.local!.driveId || item.remote?.id
                        ? "Remove only this browser copy? The Drive file will remain."
                        : "Delete this pending file? It has not been uploaded to Drive.",
                    )
                  )
                    void run(async () => {
                      await deleteVault(item.local!.id);
                    });
                }}
              >
                Remove local
              </button>
            )}
          </div>
        ))}
        {links.map((a) => (
          <div className="rw-file" key={a.id}>
            <b>{a.name}</b>
            <a href={safeUrl(a.url)} target="_blank" rel="noreferrer">
              Open linked resource
            </a>
          </div>
        ))}
        {!items.length && !links.length && (
          <p>No documents here yet. Choose a category and upload a file.</p>
        )}
      </div>
      {preview && (
        <div className="modal-backdrop">
          <section
            className="document-preview"
            role="dialog"
            aria-modal="true"
            aria-label="Document preview"
          >
            <header>
              <h3>{preview.name}</h3>
              <button onClick={() => setPreview(null)}>Close preview</button>
            </header>
            {preview.pdf ? (
              <iframe title="PDF preview" src={preview.url} />
            ) : preview.text !== undefined ? (
              <>
                <p>Text preview. Open in Drive for original formatting.</p>
                <pre>{preview.text}</pre>
              </>
            ) : (
              <p>
                Preview is available for PDF, DOCX and text files. Download this
                file or open it in Drive.
              </p>
            )}
            <a href={preview.url} download={preview.name}>
              Download original
            </a>
          </section>
        </div>
      )}
    </div>
  );
}
