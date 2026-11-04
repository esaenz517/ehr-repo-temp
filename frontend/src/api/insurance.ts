import type { PatientInsurance, InsurancePriority } from "../types";
import { apiFetch } from "./client";

export interface InsuranceInput {
  insurance_company: string;
  member_id: string;
  group_number: string | null;
  policyholder_name: string;
  policyholder_date_of_birth: string | null;
  insurance_priority: InsurancePriority;
  coverage_start_date: string | null;
  coverage_end_date: string | null;
}

export const insuranceApi = {
  list: (patientId: number) =>
    apiFetch<PatientInsurance[]>(`/patients/${patientId}/insurance`),

  create: (patientId: number, input: InsuranceInput) =>
    apiFetch<PatientInsurance>(`/patients/${patientId}/insurance`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (
    patientId: number,
    insuranceId: number,
    input: InsuranceInput
  ) =>
    apiFetch<PatientInsurance>(
      `/patients/${patientId}/insurance/${insuranceId}`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      }
    ),

  remove: (patientId: number, insuranceId: number) =>
    apiFetch<void>(
      `/patients/${patientId}/insurance/${insuranceId}`,
      { method: "DELETE" }
    ),
};
