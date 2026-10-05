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
      return <button onClick={() => startAndOpen(a)}>Start</button>;
    }
    if (a.encounter_status === "in_progress") {
      return <button onClick={() => onOpen(a)}>Continue</button>;
    }
    return null;
  };

  return (
    <div>
      <h1>My Assignments</h1>
      <button onClick={reload} style={{ marginBottom: 16 }}>Refresh</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : assignments.length === 0 ? (
        <p style={{ color: "#888" }}>No assignments yet.</p>
      ) : (
        <AssignmentList assignments={assignments} actions={actions} onOpen={onOpen} />
      )}
    </div>
  );
}
