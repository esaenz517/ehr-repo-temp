import type { Provider } from "../types";
import { apiFetch } from "./client";

export interface CreateProviderInput {
  first_name: string;
  last_name: string;
  specialty: string | null;
  phone: string | null;
  email: string | null;
}

export const providersApi = {
  list: () => apiFetch<Provider[]>("/providers"),
  create: (input: CreateProviderInput) =>
    apiFetch<Provider>("/providers", { method: "POST", body: JSON.stringify(input) }),
  remove: (providerId: number) => apiFetch<void>(`/providers/${providerId}`, { method: "DELETE" }),
};
