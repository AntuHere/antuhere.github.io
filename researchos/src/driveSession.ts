// Short-lived Google access is kept only in this tab's session storage.
// It is never written to public configuration or long-lived localStorage.
const KEY = "researchos-drive-session-v1";
export type CachedDriveSession = {
  token: string;
  expires: number;
  clientId: string;
};
export function clearDriveSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
export function saveDriveSession(value: CachedDriveSession) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {}
}
export function readDriveSession(clientId: string): CachedDriveSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    if (raw.length > 20000) throw Error("Invalid cached connection");
    const value = JSON.parse(raw);
    const now = Date.now();
    if (
      value.clientId !== clientId ||
      typeof value.token !== "string" ||
      !value.token ||
      value.token.length > 8192 ||
      !Number.isFinite(value.expires) ||
      value.expires <= now ||
      value.expires > now + 3600000
    )
      throw Error("Expired or invalid cached connection");
    return { token: value.token, expires: value.expires, clientId };
  } catch {
    clearDriveSession();
    return null;
  }
}
