import { deletionAuditApi } from "../api/deletionAudit";

/**
 * Asks the user to confirm a deletion. Returns true to go ahead.
 *
 * `path` is the API path the delete would call (e.g. `/patients/12`), so a
 * cancelled confirmation is logged against the same record as a real delete.
 * Logging a cancel never blocks or breaks the UI.
 */
export function confirmDelete(
  label: string,
  path: string,
  message = `Delete ${label}? This cannot be undone.`
): boolean {
  const confirmed = window.confirm(message);

  if (!confirmed) {
    deletionAuditApi.logCancelled(path, label).catch(() => {
      // Ignore: the backend may be unreachable; don't bother the user
    });
  }

  return confirmed;
}