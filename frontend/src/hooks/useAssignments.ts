import { useCallback, useEffect, useState } from "react";
import { assignmentApi } from "../api/assignment";
import type { Assignment } from "../types";

//AI was used to assist in building this section as dev assigned to it is 
// unfamiliar with how this works. 

// Loads the assignments given to one student.
export function useAssignments(studentId: number) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setAssignments(await assignmentApi.listForStudent(studentId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  return { assignments, loading, error, reload: load };
}
