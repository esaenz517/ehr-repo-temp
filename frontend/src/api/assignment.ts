import type { Assignment, EncounterStatus } from "../types";
import { apiFetch } from "./client";

export interface AssignmentRequest {
  case_id: number;
  course?: string | null;
  due_date?: string | null;
  assignment_type?: "graded" | "practice";
  assigned_to: number[];
  assigned_by: number;
}

export const assignmentApi = {
    create: (input: AssignmentRequest) =>
        apiFetch<Assignment[]>("/assignments", { method: "POST", body: JSON.stringify(input) }),
    listForStudent: (studentId: number) =>
        apiFetch<Assignment[]>(`/assignments/student/${studentId}`),
    listForCase: (caseId: number) =>
        apiFetch<Assignment[]>(`/assignments/case/${caseId}`),
    updateStatus: (assignmentId: number, status: EncounterStatus) =>
        apiFetch<Assignment>(`/assignments/${assignmentId}/status`, { method: "PATCH",
            body: JSON.stringify({ encounter_status: status }),
        }),
    remove: (assignmentId: number) =>
        apiFetch<void>(`/assignments/${assignmentId}`, {method: "DELETE"}),
  };