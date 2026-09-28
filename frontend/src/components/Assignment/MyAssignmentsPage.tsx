import { AssignmentList } from "./AssignmentList";
import { useAssignments } from "../../hooks/useAssignments";

//AI was used to assist in building this section as dev assigned to it is 
// unfamiliar with how this works. 

interface MyAssignmentsPageProps {
  studentId: number;
}

export function MyAssignmentsPage({ studentId }: MyAssignmentsPageProps) {
  const { assignments, loading, error } = useAssignments(studentId);

  return (
    <div>
      <h1>My Assignments</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : assignments.length === 0 ? (
        <p style={{ color: "#888" }}>No assignments yet.</p>
      ) : (
        <AssignmentList assignments={assignments} />
      )}
    </div>
  );
}
