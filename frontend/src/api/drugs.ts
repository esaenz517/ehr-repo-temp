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

// One strength a drug comes in, e.g. { strength: "500 mg Tab", route: "PO" }.
export interface DrugStrength {
  strength: string;
  route: string | null; // matches the Route dropdown (PO, SC, IM, IV, Topical), or null if unclear
}

export const drugsApi = {
  list: () => apiFetch<Drug[]>("/drugs"),
  // Medication autocomplete: best-matching names for any medication, e.g. "metf" -> ["Metformin", ...]
  suggest: (query: string) => apiFetch<string[]>(`/drugs/suggest?q=${encodeURIComponent(query)}`),
  // Dose suggestions: the strengths a drug comes in, e.g. "Metformin" -> 500 mg Tab, 850 mg Tab, ...
  strengths: (name: string) => apiFetch<DrugStrength[]>(`/drugs/strengths?name=${encodeURIComponent(name)}`),
  create: (input: CreateDrugInput) =>
    apiFetch<Drug>("/drugs", { method: "POST", body: JSON.stringify(input) }),
  update: (drugId: number, changes: UpdateDrugInput) =>
    apiFetch<Drug>(`/drugs/${drugId}`, { method: "PATCH", body: JSON.stringify(changes) }),
  remove: (drugId: number) => apiFetch<void>(`/drugs/${drugId}`, { method: "DELETE" }),
};
