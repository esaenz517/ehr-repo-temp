import { apiFetch } from "./client";

// One row of the deletion log (admin only; backend routers/deletion_audit.py).
export interface DeletionEntry {
  deletion_audit_id: number;
  occurred_at: string; // UTC
  actor_user_id: number | null;
  actor_username: string | null;
  resource: string; // e.g. "patients", "patients/medical-history"
  resource_id: string | null;
  request_path: string;
  outcome: DeletionOutcome;
  status_code: number | null;
  client_ip: string | null;
  details: string | null;
}

export type DeletionOutcome =
  | "deleted"
  | "cancelled"
  | "denied"
  | "not_found"
  | "conflict"
  | "rejected"
  | "error";

export interface DeletionFilters {
  resource?: string;
  resource_id?: string;
  outcome?: string;
  limit?: number;
  offset?: number;
}

export const deletionAuditApi = {
  // Records that the user clicked Delete and then cancelled the confirmation.
  // (Real DELETE requests are logged by the backend automatically.)
  logCancelled: (path: string, label: string) =>
    apiFetch<void>("/audit/deletions/cancelled", {
      method: "POST",
      body: JSON.stringify({ path, label }),
    }),

  // Admins: the deletion log, newest first
  list: (filters: DeletionFilters = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    const query = params.toString();
    return apiFetch<{ total: number; items: DeletionEntry[] }>(
      `/audit/deletions${query ? `?${query}` : ""}`
    );
  },

  // Admins: the kinds of records in the log (for the filter)
  resources: () => apiFetch<string[]>("/audit/deletions/resources"),
};
