// Staff side of the patient portal: a patient's portal account.
// Disabling / re-enabling it uses usersApi.setStatus (PATCH /users/{id}/status).
import type { PortalAccount } from "../types";
import { apiFetch } from "./client";

export interface PortalAccountInput {
  email: string;
  username?: string; // defaults to the email
  password?: string; // defaults to a generated temporary password, returned once
}

export const portalAccountsApi = {
  // null when the patient has no portal account
  get: (patientId: number) =>
    apiFetch<PortalAccount | null>(`/patients/${patientId}/portal-account`),

  create: (patientId: number, input: PortalAccountInput) =>
    apiFetch<PortalAccount>(`/patients/${patientId}/portal-account`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
