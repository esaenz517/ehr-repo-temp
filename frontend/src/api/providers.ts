import type { Provider } from "../types";
import { apiFetch } from "./client";

export interface CreateProviderInput {
  first_name: string;
  last_name: string;
  specialty: string | null;
  phone: string | null;
  email: string | null;
}

// Partial update - only the fields included are changed on the backend.
export interface UpdateProviderInput {
  first_name?: string;
  last_name?: string;
  specialty?: string | null;
  phone?: string | null;
  email?: string | null;
}

export const providersApi = {
  list: () => apiFetch<Provider[]>("/providers"),
  create: (input: CreateProviderInput) =>
    apiFetch<Provider>("/providers", { method: "POST", body: JSON.stringify(input) }),
  update: (providerId: number, changes: UpdateProviderInput) =>
    apiFetch<Provider>(`/providers/${providerId}`, { method: "PATCH", body: JSON.stringify(changes) }),
  remove: (providerId: number) => apiFetch<void>(`/providers/${providerId}`, { method: "DELETE" }),
};
