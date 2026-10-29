import type { Drug } from "../types";
import { apiFetch } from "./client";

export interface CreateDrugInput {
  name: string;
  description: string | null;
}

// Partial update - only the fields included are changed on the backend.
export interface UpdateDrugInput {
  name?: string;
  description?: string | null;
}

export const drugsApi = {
  list: () => apiFetch<Drug[]>("/drugs"),
  create: (input: CreateDrugInput) =>
    apiFetch<Drug>("/drugs", { method: "POST", body: JSON.stringify(input) }),
  update: (drugId: number, changes: UpdateDrugInput) =>
    apiFetch<Drug>(`/drugs/${drugId}`, { method: "PATCH", body: JSON.stringify(changes) }),
  remove: (drugId: number) => apiFetch<void>(`/drugs/${drugId}`, { method: "DELETE" }),
};
