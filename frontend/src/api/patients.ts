import type { Patient } from "../types";
import { apiFetch } from "./client";

export interface CreatePatientInput {
  mrn: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  preferred_name: string | null;
  date_of_birth: string;
  gender_at_birth: string;
  gender_identity: string;
  pronouns: string;
  status: string;
  provider_id: number | null;
  drug_ids: number[];
}

export interface PatientChartContext {
  medical_history: {
    condition: string;
    diagnosis_date: string | null;
    notes: string | null;
  }[];

  family_history: {
    relationship: string;
    condition: string;
    notes: string | null;
  }[];

  medications: {
    drug_id: number;
    name: string;
    dosage: string | null;
    route: string | null;
    frequency: string | null;
  }[];

  allergies: {
    substance: string;
    reaction: string | null;
  }[];

  latest_vitals: {
    recorded_at: string;
    blood_pressure: string | null;
    heart_rate: number | null;
    respiratory_rate: number | null;
    temperature_c: number | null;
    oxygen_saturation: number | null;
    height_cm: number | null;
    weight_kg: number | null;
  } | null;

  recent_labs: {
    test_name: string;
    result: string;
    unit: string | null;
    flag: string | null;
    collected_at: string;
  }[];
}

export const patientsApi = {
  list: () => apiFetch<Patient[]>("/patients"),

  get: (patientId: number) =>
    apiFetch<Patient>(`/patients/${patientId}`),

  chartContext: (patientId: number) =>
    apiFetch<PatientChartContext>(
      `/patients/${patientId}/chart-context`
    ),

  create: (input: CreatePatientInput) =>
    apiFetch<Patient>("/patients", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  remove: (patientId: number) =>
    apiFetch<void>(`/patients/${patientId}`, {
      method: "DELETE",
    }),
};
