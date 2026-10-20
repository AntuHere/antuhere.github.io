import { createContext, useContext, useState, type ReactNode } from "react";
import { FlaskConical, LogIn } from "lucide-react";

// This is a browser convenience lock on a public static site, not server authentication.
const KEY = "researchos-admin-session";
const AdminContext = createContext<{ signOut: () => void } | null>(null);
export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) throw Error("Workspace login required");
  return value;
}
function remembered() {
  try {
    if (localStorage.getItem(KEY) === "admin") return true;
  } catch {}
  try {
    return sessionStorage.getItem(KEY) === "admin";
  } catch {
    return false;
  }
}
export default function AdminGate({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(remembered),
    [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [remember, setRemember] = useState(true),
    [error, setError] = useState("");
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
          onSubmit={(e) => {
            e.preventDefault();
            if (username.trim() !== "admin" || password !== "admin") {
              setError("Incorrect username or password.");
              return;
            }
            try {
              if (remember) localStorage.setItem(KEY, "admin");
              else localStorage.removeItem(KEY);
            } catch {}
            try {
              sessionStorage.setItem(KEY, "admin");
            } catch {}
            setPassword("");
            setError("");
            setLoggedIn(true);
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
          <button className="primary" type="submit">
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
