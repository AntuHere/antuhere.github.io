import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { FlaskConical, LogIn } from "lucide-react";
import { DriveClient } from "./drive";
import {
  clearDriveSession,
  readDriveSession,
  saveDriveSession,
} from "./driveSession";

declare global {
  interface Window {
    google?: any;
  }
}
export type Session = {
  email: string;
  name: string;
  drive: DriveClient;
  signOut: () => void;
};
type GoogleConnection = {
  email: string;
  drive: DriveClient | null;
  connection: React.ReactNode;
};
const GoogleSession = createContext<GoogleConnection | null>(null);
export const useGoogle = () => {
  const value = useContext(GoogleSession);
  if (!value) throw Error("Google sign-in required");
  return value;
};
const OWNER = "nasfiqul.antu@gmail.com";
let scriptJob: Promise<void> | undefined;
function googleScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptJob) return scriptJob;
  scriptJob = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      scriptJob = undefined;
      reject(
        Error(
          "Google sign-in could not load. Check your connection and reload to retry.",
        ),
      );
    };
    document.head.append(script);
  });
  return scriptJob;
}
async function verifyAccount(token: string) {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: "Bearer " + token } },
  );
  if (!response.ok)
    throw Error(
      "Google could not verify this Drive connection. Please reconnect.",
    );
  const profile = await response.json();
  if (
    profile.email_verified !== true ||
    String(profile.email).toLowerCase() !== OWNER
  ) {
    window.google?.accounts?.oauth2?.revoke?.(token);
    throw Error(
      "This workspace is for " + OWNER + ". Choose that Google account.",
    );
  }
  return profile;
}
export default function GoogleGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [googleReady, setGoogleReady] = useState(false);
  const [clientId, setClientId] = useState("");
  const [configured, setConfigured] = useState(false);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const signOut = () => {
    generation.current++;
    if (timer.current) clearTimeout(timer.current);
    clearDriveSession();
    setSession(null);
    setBusy(false);
  };
  useEffect(() => {
    let mounted = true;
    fetch("/researchos/google-config.json", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((config) => {
        if (!mounted) return;
        let id = config.clientId || "";
        try {
          id = id || localStorage.getItem("researchos-google-client-id") || "";
        } catch {}
        setClientId(id);
        setConfigured(Boolean(id));
      })
      .catch(() => {
        if (mounted)
          setError(
            "Drive configuration could not load. Your local workspace is still available.",
          );
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
      generation.current++;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (!/^\d+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId))
      return;
    let active = true;
    void googleScript()
      .then(() => {
        if (active) setGoogleReady(true);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [clientId]);
  useEffect(() => {
    if (!clientId) return;
    const cached = readDriveSession(clientId);
    if (!cached) return;
    const attempt = ++generation.current;
    let active = true;
    setBusy(true);
    void verifyAccount(cached.token)
      .then((profile) => {
        if (!active || attempt !== generation.current) return;
        if (cached.expires <= Date.now()) {
          clearDriveSession();
          return;
        }
        setError("");
        const drive = new DriveClient(cached.token, cached.expires, signOut);
        setSession({
          email: OWNER,
          name: profile.name || "Antu",
          drive,
          signOut,
        });
        timer.current = setTimeout(signOut, cached.expires - Date.now());
      })
      .catch((e) => {
        if (!active || attempt !== generation.current) return;
        clearDriveSession();
        setError(e instanceof Error ? e.message : "Please reconnect Drive.");
      })
      .finally(() => {
        if (active && attempt === generation.current) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [clientId]);
  const signIn = async () => {
    setError("");
    setBusy(true);
    const attempt = ++generation.current;
    try {
      if (!/^\d+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId))
        throw Error(
          "Enter a Google OAuth Web client ID ending in .apps.googleusercontent.com.",
        );
      await googleScript();
      const response: any = await new Promise((resolve, reject) => {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope:
            "https://www.googleapis.com/auth/drive.file openid email profile",
          hint: OWNER,
          callback: (result: any) =>
            result.error
              ? reject(Error(result.error_description || result.error))
              : resolve(result),
          error_callback: (result: any) =>
            reject(
              Error(
                result.type === "popup_closed"
                  ? "Google sign-in was closed. Try again."
                  : "Google sign-in could not open. Allow the sign-in popup and try again.",
              ),
            ),
        });
        // Let Google reuse the hinted account and existing consent. A user click
        // still opens the Google popup when fresh access is needed.
        client.requestAccessToken({ prompt: "" });
      });
      const token = response.access_token;
      if (!token)
        throw Error("Google did not provide access. Try signing in again.");
      const issued = Date.now();
      const profile = await verifyAccount(token);
      if (
        !String(response.scope || "")
          .split(" ")
          .includes("https://www.googleapis.com/auth/drive.file")
      )
        throw Error(
          "Drive access was not granted. Sign in again and allow ResearchOS to manage the files it creates.",
        );
      if (attempt !== generation.current) return;
      const seconds = Number(response.expires_in);
      const expires =
        issued +
        Math.min(3600, Math.max(1, Number.isFinite(seconds) ? seconds : 3600)) *
          1000;
      if (expires <= Date.now())
        throw Error(
          "Google access expired while connecting. Please try again.",
        );
      const drive = new DriveClient(token, expires, signOut);
      setSession({
        email: OWNER,
        name: profile.name || "Antu",
        drive,
        signOut,
      });
      timer.current = setTimeout(signOut, Math.max(1, expires - Date.now()));
      saveDriveSession({ token, expires, clientId });
      // Only the public client ID is saved in long-lived local storage. The
      // access token stays in this tab and keeps its original Google expiry.
      try {
        localStorage.setItem("researchos-google-client-id", clientId);
      } catch {}
    } catch (e) {
      if (attempt === generation.current)
        setError(e instanceof Error ? e.message : "Google sign-in failed.");
    } finally {
      if (attempt === generation.current) setBusy(false);
    }
  };
  const connection = session ? (
    <section className="panel settings-panel">
      <h3>Google Drive connected</h3>
      <p>{session.email}</p>
      <button className="secondary" onClick={signOut}>
        Disconnect Drive
      </button>
    </section>
  ) : (
    <section className="panel settings-panel drive-connection">
      <div>
        <div className="signin-brand">
          <FlaskConical size={30} />
          <strong>ResearchOS</strong>
        </div>
        <h3>Connect Google Drive (optional)</h3>
        <p>
          Connect <strong>{OWNER}</strong> for Drive uploads. Your workspace
          works without this connection.
        </p>
        {!ready ? (
          <p role="status">Loading sign-in…</p>
        ) : (
          <>
            {!configured && (
              <details open className="signin-setup">
                <summary>One-time Google connection setup</summary>
                <p>
                  A Google OAuth Web client ID is needed only to connect Drive.
                  It is public configuration, not a password or client secret.
                </p>
                <label className="field">
                  <span>Google OAuth Web client ID</span>
                  <input
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="123…apps.googleusercontent.com"
                    autoComplete="off"
                  />
                </label>
                <p>
                  In Google Cloud, enable Drive API, add your email as a test
                  user, and authorize <code>https://antuhere.github.io</code> as
                  a JavaScript origin. Follow the{" "}
                  <a
                    href="https://github.com/AntuHere/antuhere.github.io/blob/master/docs/researchos-google-setup.md"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google setup guide
                  </a>
                  .
                </p>
              </details>
            )}
            <button
              className="primary"
              onClick={() => void signIn()}
              disabled={busy || !clientId || !googleReady}
            >
              <LogIn size={18} />
              {busy ? "Connecting to Google…" : "Sign in with Google"}
            </button>
            {configured && (
              <button
                className="rw-button"
                onClick={() => setConfigured(false)}
              >
                Change Google client ID
              </button>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="rw-error">
            {error}
          </p>
        )}
        <small>
          Refreshing this page keeps Drive connected while Google access is
          valid. Closing the tab or access expiration may require reconnecting.
          Your workspace login stays remembered separately.
        </small>
      </div>
    </section>
  );
  return (
    <GoogleSession.Provider
      value={{
        drive: session?.drive || null,
        email: session?.email || "antuhere",
        connection,
      }}
    >
      {children}
    </GoogleSession.Provider>
  );
}
