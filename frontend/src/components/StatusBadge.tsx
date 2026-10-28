import type { EncounterStatus } from "../types";

export const STATUS_LABELS: Record<EncounterStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  signed: "Signed",
};

// Colored status chip. Colors come from the --status-* tokens in theme.css,
// so a status looks the same on every page.
export function StatusBadge({ status, label }: { status: EncounterStatus; label?: string }) {
  return <span className={`ui-badge ui-badge--${status}`}>{label ?? STATUS_LABELS[status]}</span>;
}
