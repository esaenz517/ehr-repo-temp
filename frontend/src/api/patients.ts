import type { Patient } from "../types";
import { apiFetch } from "./client";

export interface CreatePatientInput {
  mrn: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  date_of_birth: string;
  gender: string | null;
  status: string;
}

export const patientsApi = {
  list: () => apiFetch<Patient[]>("/patients"),
  create: (input: CreatePatientInput) =>
    apiFetch<Patient>("/patients", { method: "POST", body: JSON.stringify(input) }),
  remove: (patientId: number) => apiFetch<void>(`/patients/${patientId}`, { method: "DELETE" }),
};
