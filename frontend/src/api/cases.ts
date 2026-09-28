import type { Case } from "../types";
import { apiFetch } from "./client";

// One medication saved to the case's patient.
export interface MedicationInput {
  drug_id: number;
  dose: string | null;
  route: string | null;
  frequency: string | null;
}

// One allergy saved to the case's patient.
export interface AllergyInput {
  substance: string;
  reaction: string | null;
}

// One lab result saved to the case's patient.
export interface LabResultInput {
  test_name: string;
  result: string;
  unit: string | null;
  flag: string | null;
  collected_at: string;
}

// Shape of the data sent to the backend when creating a case.
// The patient must already exist (create it with patientsApi first).
export interface CreateCaseInput {
  patient_id: number;
  chief_complaint: string;
  narrative: string | null;
  created_by_staff_id: number;
  medications: MedicationInput[];
  allergies: AllergyInput[];
  labs: LabResultInput[];
}

// One function per backend endpoint under /cases.
export const casesApi = {
  list: () => apiFetch<Case[]>("/cases"),
  get: (caseId: number) => apiFetch<Case>(`/cases/${caseId}`),
  create: (input: CreateCaseInput) =>
    apiFetch<Case>("/cases", { method: "POST", body: JSON.stringify(input) }),
  remove: (caseId: number) => apiFetch<void>(`/cases/${caseId}`, { method: "DELETE" }),
};
