import { FormEvent, useState } from "react";
import { loginApi } from "../api/login";
import type { LoginResponse } from "../types";

interface LoginPageProps {
  onLogin: (user: LoginResponse) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    try {
      const user = await loginApi.login({ username, password });
      onLogin(user);
    } catch {
      setError("Invalid username or password");
      setPassword("");
    }
  };

  return (
    <div>
      <h1>Login</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          style={{ flex: 2 }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{ flex: 2 }}
        />
        <button type="submit">Login</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}