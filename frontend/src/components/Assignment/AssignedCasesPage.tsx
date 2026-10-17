import { useState } from "react";
import { AssignmentList } from "./AssignmentList";
import { StudentNoteView } from "./StudentNoteView";
import { useAssignments } from "../../hooks/useAssignments";
import { useStaff } from "../../hooks/useStaff";
import type { Assignment } from "../../types";

interface AssignedCasesPageProps {
  staffId: number; // the instructor who handed out the assignments
}

// Instructor view: every assignment this staff member handed out, with each
// student's progress. Started work can be opened to read the student's saved
// SOAP note; submitted work can be signed off or sent back for re-work.
export function AssignedCasesPage({ staffId }: AssignedCasesPageProps) {
  const { assignments, loading, error, reload, updateStatus } = useAssignments(staffId, "instructor");
  const { staff } = useStaff();
  const [viewingId, setViewingId] = useState<number | null>(null);
  // Looked up from the list so Sign off / Send back show the new status right away
  const viewing = assignments.find((a) => a.assignment_id === viewingId);

  const studentName = (id: number) => {
    const s = staff.find((m) => m.staffid === id);
    return s ? `${s.last_name}, ${s.first_name}` : `Staff #${id}`;
  };

  const reviewActions = (a: Assignment) =>
    a.encounter_status === "submitted" ? (
      <>
        <button onClick={() => updateStatus(a.assignment_id, "signed")}>Sign off</button>
        <button onClick={() => updateStatus(a.assignment_id, "in_progress")}>Send back</button>
      </>
    ) : null;

  const actions = (a: Assignment) => (
    <>
      {a.encounter_status !== "not_started" && (
        <button onClick={() => setViewingId(a.assignment_id)}>View note</button>
      )}
      {reviewActions(a)}
    </>
  );

  if (viewing) {
    return (
      <StudentNoteView
        assignment={viewing}
        studentName={studentName(viewing.assigned_to)}
        actions={reviewActions(viewing)}
        onRefresh={reload}
        onBack={() => setViewingId(null)}
      />
    );
  }

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