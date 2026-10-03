import { AssignmentList } from "./AssignmentList";
import { useAssignments } from "../../hooks/useAssignments";
import type { Assignment } from "../../types";

//AI was used to assist in building this section as dev assigned to it is 
// unfamiliar with how this works. 

interface MyAssignmentsPageProps {
  studentId: number;
}

export function MyAssignmentsPage({ studentId }: MyAssignmentsPageProps) {
  const { assignments, loading, error, reload, updateStatus } = useAssignments(studentId);

  // Progress of the assignment
  const actions = (a: Assignment) => {
    if (a.encounter_status === "not_started") {
      return <button onClick={() => updateStatus(a.assignment_id, "in_progress")}>Start</button>;
    }
    if (a.encounter_status === "in_progress") {
      return <button onClick={() => updateStatus(a.assignment_id, "submitted")}>Submit</button>;
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
        <AssignmentList assignments={assignments} actions={actions} />
      )}
    </div>
  );
}
