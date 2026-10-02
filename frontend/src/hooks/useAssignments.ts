import { useCallback, useEffect, useState } from "react";
import { assignmentApi } from "../api/assignment";
import type { Assignment, EncounterStatus } from "../types";

//AI was used to assist in building this section as dev assigned to it is 
// unfamiliar with how this works. 

// "student": assignments given to this staff member.
// "instructor": assignments this staff member handed out.
export type AssignmentScope = "student" | "instructor";

// Loads assignments for one staff member and lets the page change their status.
export function useAssignments(staffId: number, scope: AssignmentScope = "student") {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setAssignments(
        scope === "student"
          ? await assignmentApi.listForStudent(staffId)
          : await assignmentApi.listAssignedBy(staffId)
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, [staffId, scope]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (assignmentId: number, status: EncounterStatus) => {
    try {
      const updated = await assignmentApi.updateStatus(assignmentId, status);
      setAssignments((prev) =>
        prev.map((a) => (a.assignment_id === assignmentId ? updated : a))
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update assignment");
    }
  };

  return { assignments, loading, error, reload: load, updateStatus };
}