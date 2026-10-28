import type { ReactNode } from "react";
import type { Assignment } from "../../types";
import { StatusBadge } from "../StatusBadge";

//AI was used to assist in building this section as dev assigned to it is
// unfamiliar with how this works.

interface AssignmentListProps {
  assignments: Assignment[];
  studentName?: (staffId: number) => string; // shown when set (instructor view)
  actions?: (assignment: Assignment) => ReactNode; // buttons beside the status
  onOpen?: (assignment: Assignment) => void; // when set, clicking a case opens it
}

// Due dates are stored in UTC without a time zone marker, so add "Z" before converting to local time.
function formatDueDate(dueDate: string | null) {
  return dueDate ? new Date(dueDate + "Z").toLocaleString() : "(No due date)";
}

export function AssignmentList({ assignments, studentName, actions, onOpen }: AssignmentListProps) {
  return (
    <ul className="ui-row-list">
      {assignments.map((a) => (
        <li key={a.assignment_id} className="ui-row">
          <div
            className={`ui-row-main${onOpen ? " ui-row-main--link" : ""}`}
            onClick={onOpen ? () => onOpen(a) : undefined}
            onKeyDown={onOpen ? (e) => e.key === "Enter" && onOpen(a) : undefined}
            role={onOpen ? "button" : undefined}
            tabIndex={onOpen ? 0 : undefined}
          >
            <div className="ui-row-title">
              Case #{a.case_id}
              {studentName && <> · {studentName(a.assigned_to)}</>}
              {a.patient_name && <> · {a.patient_name}</>}
            </div>
            {a.chief_complaint && <div className="ui-row-subtitle">{a.chief_complaint}</div>}
            <div className="ui-row-subtitle">
              {a.course ?? "No course"} · Due {formatDueDate(a.due_date)}
            </div>
          </div>
          <div className="ui-row-actions">
            <StatusBadge status={a.encounter_status} />
            {actions?.(a)}
          </div>
        </li>
      ))}
    </ul>
  );
}
