import type { LoginResponse } from "../types";
import { apiFetch } from "./client";

export interface LoginRequest {
  username: string;
  password: string;
}

export const loginApi = {
    login: (input: LoginRequest) =>
      apiFetch<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) }),

    // Who the session cookie belongs to; fails with 401 when signed out.
    me: () => apiFetch<LoginResponse>("/auth/me"),

    logout: () => apiFetch<void>("/auth/logout", { method: "POST" }),
  };
