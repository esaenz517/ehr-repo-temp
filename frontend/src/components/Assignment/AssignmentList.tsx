import type { ReactNode } from "react";
import type { Assignment, EncounterStatus } from "../../types";

//AI was used to assist in building this section as dev assigned to it is 
// unfamiliar with how this works. 

interface AssignmentListProps {
  assignments: Assignment[];
  studentName?: (staffId: number) => string; // shown when set (instructor view)
  actions?: (assignment: Assignment) => ReactNode; // buttons beside the status
}

const STATUS_LABELS: Record<EncounterStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  signed: "Signed",
};

// Color the status text for ease of viewing
const STATUS_COLORS: Record<EncounterStatus, { background: string; color: string }> = {
  not_started: { background: "#c62828", color: "#fff" }, // red
  in_progress: { background: "#f9a825", color: "#222" }, // gold (dark text for readability)
  submitted:   { background: "#1565c0", color: "#fff" }, // blue
  signed:      { background: "#2e7d32", color: "#fff" }, // green
};

// Due dates are stored in UTC without a time zone marker, so add "Z" before converting to local time.
function formatDueDate(dueDate: string | null) {
  return dueDate ? new Date(dueDate + "Z").toLocaleString() : "(No due date)";
}

export function AssignmentList({ assignments, studentName, actions }: AssignmentListProps) {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {assignments.map((a) => (
        <li
          key={a.assignment_id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <div>
            <strong>Case #{a.case_id}</strong>
            {studentName && <> · {studentName(a.assigned_to)}</>}
            {a.patient_name && <span> · {a.patient_name}</span>}
            {a.chief_complaint && (
              <div style={{ fontSize: 14 }}>{a.chief_complaint}</div>
            )}
            <div style={{ fontSize: 14, color: "#555" }}>
              {a.course ?? "No course"} · Due {formatDueDate(a.due_date)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span
              style={{
                ...STATUS_COLORS[a.encounter_status],
                padding: "2px 10px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {STATUS_LABELS[a.encounter_status]}
            </span>
            {actions?.(a)}
          </div>
        </li>
      ))}
    </ul>
  );
}

