import type { Case } from "../types";
import { apiFetch } from "./client";

// Shape of the data sent to the backend when creating a case.
// The patient must already exist (create it with patientsApi first).
export interface CreateCaseInput {
  patient_id: number;
  chief_complaint: string;
  narrative: string | null;
  created_by_staff_id: number;
}

// One function per backend endpoint under /cases.
export const casesApi = {
  list: () => apiFetch<Case[]>("/cases"),
  get: (caseId: number) => apiFetch<Case>(`/cases/${caseId}`),
  create: (input: CreateCaseInput) =>
    apiFetch<Case>("/cases", { method: "POST", body: JSON.stringify(input) }),
  remove: (caseId: number) => apiFetch<void>(`/cases/${caseId}`, { method: "DELETE" }),
};
