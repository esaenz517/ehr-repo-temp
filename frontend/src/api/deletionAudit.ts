import { apiFetch } from "./client";

export const deletionAuditApi = {
  // Records that the user clicked Delete and then cancelled the confirmation.
  // (Real DELETE requests are logged by the backend automatically.)
  logCancelled: (path: string, label: string) =>
    apiFetch<void>("/audit/deletions/cancelled", {
      method: "POST",
      body: JSON.stringify({ path, label }),
    }),
};
