import { FormEvent, useEffect, useState } from "react";
import { loginApi } from "../../api/login";
import type { LoginResponse } from "../../types";
import logo from "../../images/UTEP-Logo.png";
import "./login.css";

interface LoginPageProps {
  onLogin: (user: LoginResponse) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Back from Duo after a denied, expired, or tampered two-factor prompt
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("duo_error")) {
      setError("Two-factor verification failed. Please sign in again.");
      params.delete("duo_error");
      const query = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : ""));
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setSubmitting(true);
    setError(null);
    try {
      const user = await loginApi.login({ username, password });
      if (user.duo_auth_url) {
        // Password was right; Duo finishes the sign-in and redirects back to the app
        window.location.assign(user.duo_auth_url);
        return; // keep the button disabled while the browser leaves
      }
      onLogin(user);
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes("503")
          ? "Two-factor service is unavailable. Please try again later."
          : "Invalid username or password"
      );
      setPassword("");
    }
    setSubmitting(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <img className="login-logo" src={logo} alt="UTEP logo" />
          <h1 className="login-title">Electronic Medical Records</h1>
          <p className="login-subtitle">Sign in to continue</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button className="login-button" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          {error && <p className="login-error" role="alert">{error}</p>}
        </form>
      </div>
    </div>
  );
}
