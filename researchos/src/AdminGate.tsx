import { createContext, useContext, useState, type ReactNode } from "react";
import { FlaskConical, LogIn } from "lucide-react";

// This is a browser convenience lock on a public static site, not server authentication.
const KEY = "researchos-admin-session";
const USERNAME = "antuhere";
const SESSION = "antuhere-v1";
// A digest avoids publishing the literal password; this browser lock can still be bypassed.
const PASSWORD_DIGEST =
  "6324e6344c2b00b268776ea379bf32860ce5d05c0c798c54e7348983e2a7432b";
const AdminContext = createContext<{ signOut: () => void } | null>(null);
export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) throw Error("Workspace login required");
  return value;
}
function remembered() {
  try {
    if (localStorage.getItem(KEY) === SESSION) return true;
  } catch {}
  try {
    return sessionStorage.getItem(KEY) === SESSION;
  } catch {
    return false;
  }
}
export default function AdminGate({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(remembered),
    [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [remember, setRemember] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const signOut = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    try {
      sessionStorage.removeItem(KEY);
    } catch {}
    setPassword("");
    setLoggedIn(false);
  };
  if (loggedIn)
    return (
      <AdminContext.Provider value={{ signOut }}>
        {children}
      </AdminContext.Provider>
    );
  return (
    <main className="signin-page">
      <section className="signin-card">
        <div className="signin-brand">
          <FlaskConical size={30} />
          <strong>ResearchOS</strong>
        </div>
        <h1>Admin login</h1>
        <p>Open your research workspace.</p>
        <form
          className="admin-login-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            try {
              const digest = await crypto.subtle.digest(
                "SHA-256",
                new TextEncoder().encode(password),
              );
              const value = Array.from(new Uint8Array(digest), (byte) =>
                byte.toString(16).padStart(2, "0"),
              ).join("");
              if (username.trim() !== USERNAME || value !== PASSWORD_DIGEST) {
                setError("Incorrect username or password.");
                return;
              }
              try {
                if (remember) localStorage.setItem(KEY, SESSION);
                else localStorage.removeItem(KEY);
              } catch {}
              try {
                sessionStorage.setItem(KEY, SESSION);
              } catch {}
              setPassword("");
              setLoggedIn(true);
            } catch {
              setError(
                "Could not check the login. Open ResearchOS over HTTPS and try again.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="field">
            <span>Username</span>
            <input
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="remember-login">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me on this browser
          </label>
          {error && (
            <p role="alert" className="rw-error">
              {error}
            </p>
          )}
          <button className="primary" type="submit" disabled={busy}>
            <LogIn size={18} />
            Log in
          </button>
        </form>
        <small>
          Simple browser lock only. This public website does not provide secure
          private access.
        </small>
        <a href="/">Back to portfolio</a>
      </section>
    </main>
  );
}
