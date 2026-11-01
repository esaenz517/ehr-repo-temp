import { AssignmentList } from "./AssignmentList";
import { useAssignments } from "../../hooks/useAssignments";
import type { Assignment } from "../../types";

//AI was used to assist in building this section as dev assigned to it is 
// unfamiliar with how this works. 

interface MyAssignmentsPageProps {
  studentId: number;
  onOpen: (assignment: Assignment) => void;
}

export function MyAssignmentsPage({ studentId, onOpen }: MyAssignmentsPageProps) {
  const { assignments, loading, error, reload, start } = useAssignments(studentId);

  // Starting a case opens it straight into the workspace. Submitting happens there,
  // next to the SOAP note, so a case can't be turned in without a saved note.
  const startAndOpen = async (a: Assignment) => {
    const updated = await start(a.assignment_id);
    if (updated) onOpen(updated);
  };

  const actions = (a: Assignment) => {
    if (a.encounter_status === "not_started") {
      return <button className="ui-button" onClick={() => startAndOpen(a)}>Start</button>;
    }
    if (a.encounter_status === "in_progress") {
      return <button className="ui-button ui-button--secondary" onClick={() => onOpen(a)}>Continue</button>;
    }
    return null;
  };

  return (
    <div className="ui-page">
      <h1 className="ui-page-title">My Assignments</h1>
      <div className="ui-toolbar">
        <button className="ui-button ui-button--secondary" onClick={reload}>Refresh</button>
      </div>

      {error && <p className="ui-error">{error}</p>}
      {loading ? (
        <p className="ui-muted">Loading...</p>
      ) : assignments.length === 0 ? (
        <p className="ui-row-empty">No assignments yet.</p>
      ) : (
        <AssignmentList assignments={assignments} actions={actions} onOpen={onOpen} />
      )}
    </div>
  );
}
