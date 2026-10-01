import type { BillingCharge } from "../types";
import { apiFetch } from "./client";

export interface BillingChargeInput {
  charge_summary: string;
  charge_amount: string;
}

export const billingApi = {
  list: (patientId: number) =>
    apiFetch<BillingCharge[]>(`/patients/${patientId}/charges`),

  create: (patientId: number, input: BillingChargeInput) =>
    apiFetch<BillingCharge>(`/patients/${patientId}/charges`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (
    patientId: number,
    chargeId: number,
    input: BillingChargeInput
  ) =>
    apiFetch<BillingCharge>(
      `/patients/${patientId}/charges/${chargeId}`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      }
    ),

  remove: (patientId: number, chargeId: number) =>
    apiFetch<void>(
      `/patients/${patientId}/charges/${chargeId}`,
      { method: "DELETE" }
    ),
};