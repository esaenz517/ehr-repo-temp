import type { FamilyHistory, MedicalHistory } from "../types";
import { apiFetch } from "./client";

export interface CreateMedicalHistoryInput {
  condition: string;
  diagnosis_date: string | null;
  notes: string | null;
}

export interface CreateFamilyHistoryInput {
  relationship: string;
  condition: string;
  notes: string | null;
}

export const medicalHistoryApi = {
  listMedical: (patientId: number) =>
    apiFetch<MedicalHistory[]>(`/patients/${patientId}/medical-history`),

  createMedical: (patientId: number, input: CreateMedicalHistoryInput) =>
    apiFetch<MedicalHistory>(`/patients/${patientId}/medical-history`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  removeMedical: (patientId: number, medicalHistoryId: number) =>
    apiFetch<void>(
      `/patients/${patientId}/medical-history/${medicalHistoryId}`,
      { method: "DELETE" }
    ),

  listFamily: (patientId: number) =>
    apiFetch<FamilyHistory[]>(`/patients/${patientId}/family-history`),

  createFamily: (patientId: number, input: CreateFamilyHistoryInput) =>
    apiFetch<FamilyHistory>(`/patients/${patientId}/family-history`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  removeFamily: (patientId: number, familyHistoryId: number) =>
    apiFetch<void>(
      `/patients/${patientId}/family-history/${familyHistoryId}`,
      { method: "DELETE" }
    ),
};