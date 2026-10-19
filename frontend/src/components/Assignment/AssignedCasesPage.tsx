import { useState } from "react";
import { AssignmentList } from "./AssignmentList";
import { AssignmentReview } from "./AssignmentReview";
import { StudentNoteView } from "./StudentNoteView";
import { useAssignments } from "../../hooks/useAssignments";
import { useStaff } from "../../hooks/useStaff";
import type { Assignment } from "../../types";

interface AssignedCasesPageProps {
  staffId: number; // the instructor who handed out the assignments
  initialViewingId?: number | null; // opens this assignment's note right away (from the dashboard)
}

// Instructor view: every assignment this staff member handed out, with each
// student's progress. Started work can be opened to read the student's saved
// SOAP note; submitted work is scored on the case's rubric, given feedback,
// then signed off or sent back for re-work.
export function AssignedCasesPage({ staffId, initialViewingId = null }: AssignedCasesPageProps) {
  const { assignments, loading, error, reload, updateStatus, saveFeedback } = useAssignments(staffId, "instructor");
  const { staff } = useStaff();
  const [viewingId, setViewingId] = useState<number | null>(initialViewingId);
  // Looked up from the list so Sign off / Send back show the new status right away
  const viewing = assignments.find((a) => a.assignment_id === viewingId);

  const studentName = (id: number) => {
    const s = staff.find((m) => m.staffid === id);
    return s ? `${s.last_name}, ${s.first_name}` : `Staff #${id}`;
  };

  // Sign off / Send back happen inside the note view, next to the feedback box
  const actions = (a: Assignment) =>
    a.encounter_status !== "not_started" && (
      <button onClick={() => setViewingId(a.assignment_id)}>
        {a.encounter_status === "submitted" ? "Review" : "View note"}
      </button>
    );

  if (viewing) {
    return (
      <StudentNoteView
        assignment={viewing}
        studentName={studentName(viewing.assigned_to)}
        review={
          <AssignmentReview
            assignment={viewing}
            error={error}
            onSaveFeedback={(text) => saveFeedback(viewing.assignment_id, text)}
            onDecision={(status, text) => updateStatus(viewing.assignment_id, status, text)}
          />
        }
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