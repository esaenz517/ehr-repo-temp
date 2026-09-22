import type { Drug } from "../types";
import { apiFetch } from "./client";

export interface CreateDrugInput {
  name: string;
  description: string | null;
}

export const drugsApi = {
  list: () => apiFetch<Drug[]>("/drugs"),
  create: (input: CreateDrugInput) =>
    apiFetch<Drug>("/drugs", { method: "POST", body: JSON.stringify(input) }),
  remove: (drugId: number) => apiFetch<void>(`/drugs/${drugId}`, { method: "DELETE" }),
};
