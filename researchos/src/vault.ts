import { uid } from "./data";
import { type Category, type DriveClient } from "./drive";
import type { Project } from "./data";
export type VaultRecord = {
  id: string;
  projectId: string;
  name: string;
  size: number;
  type: string;
  created: string;
  file: Blob;
  category?: Category;
  driveId?: string;
  driveUrl?: string;
};
async function operation<T>(
  mode: IDBTransactionMode,
  work: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("researchos-document-vault-v1", 1);
    r.onupgradeneeded = () =>
      r.result.createObjectStore("documents", { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction("documents", mode);
      const r = work(tx.objectStore("documents"));
      tx.oncomplete = () => resolve(r.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export const getVault = () =>
  operation<VaultRecord[]>("readonly", (s) => s.getAll());
export const putVault = (r: VaultRecord) =>
  operation("readwrite", (s) => s.put(r));
export const deleteVault = (id: string) =>
  operation("readwrite", (s) => s.delete(id));
export async function stageFile(
  project: Project,
  category: Category,
  file: File,
) {
  if (file.size > 50 * 1024 * 1024)
    throw Error("Maximum upload size is 50 MB.");
  const record: VaultRecord = {
    id: uid(),
    projectId: project.id,
    name: file.name,
    size: file.size,
    type: file.type,
    created: new Date().toISOString(),
    file,
    category,
  };
  await putVault(record);
  return record;
}
export async function syncFile(
  drive: DriveClient,
  project: Project,
  record: VaultRecord,
) {
  const remote = await drive.upload(
    project,
    record.category || "Other",
    record.file,
    record.name,
    record.id,
  );
  const saved = { ...record, driveId: remote.id, driveUrl: remote.webViewLink };
  await putVault(saved);
  return saved;
}
