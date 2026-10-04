import type { LoginResponse } from "../types";
import { apiFetch } from "./client";

export interface LoginRequest {
  username: string;
  password: string;
}

export const loginApi = {
    login: (input: LoginRequest) =>
      apiFetch<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) }),
    // Who is signed in, from the session cookie; fails with 401 if there is no valid session
    me: () => apiFetch<LoginResponse>("/auth/me"),
    logout: () => apiFetch<void>("/auth/logout", { method: "POST" }),
  };