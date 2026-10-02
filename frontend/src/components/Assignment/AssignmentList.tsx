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

// Due dates are stored in UTC without a time zone marker, so add "Z" before converting to local time.
function formatDueDate(dueDate: string | null) {
  return dueDate ? new Date(dueDate + "Z").toLocaleString() : "No due date";
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
            <div style={{ fontSize: 14, color: "#555" }}>
              {a.course ?? "No course"} · Due {formatDueDate(a.due_date)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span>{STATUS_LABELS[a.encounter_status]}</span>
            {actions?.(a)}
          </div>
        </li>
      ))}
    </ul>
  );
}

