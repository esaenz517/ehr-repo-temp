import { AssignmentList } from "./AssignmentList";
import { useAssignments } from "../../hooks/useAssignments";
import { useStaff } from "../../hooks/useStaff";
import type { Assignment } from "../../types";

interface AssignedCasesPageProps {
  staffId: number; // the instructor who handed out the assignments
}

// Instructor view: every assignment this staff member handed out, with each
// student's progress. Submitted work can be signed off or sent back for re-work.
export function AssignedCasesPage({ staffId }: AssignedCasesPageProps) {
  const { assignments, loading, error, reload, updateStatus } = useAssignments(staffId, "instructor");
  const { staff } = useStaff();

  const studentName = (id: number) => {
    const s = staff.find((m) => m.staffid === id);
    return s ? `${s.last_name}, ${s.first_name}` : `Staff #${id}`;
  };

  const actions = (a: Assignment) =>
    a.encounter_status === "submitted" ? (
      <>
        <button onClick={() => updateStatus(a.assignment_id, "signed")}>Sign off</button>
        <button onClick={() => updateStatus(a.assignment_id, "in_progress")}>Send back</button>
      </>
    ) : null;

  return (
    <div>
      <h1>Assigned Cases</h1>
      <button onClick={reload} style={{ marginBottom: 16 }}>Refresh</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : assignments.length === 0 ? (
        <p style={{ color: "#888" }}>You haven't assigned any cases yet.</p>
      ) : (
        <AssignmentList assignments={assignments} studentName={studentName} actions={actions} />
      )}
    </div>
  );
}