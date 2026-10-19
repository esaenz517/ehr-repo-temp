import type { AssignmentGrade } from "../types";
import { apiFetch } from "./client";

// One score the instructor enters for one rubric item.
export interface RubricScoreInput {
  rubric_item_id: number;
  points_awarded: number;
  comment: string | null;
}

export const rubricApi = {
  // Instructor view contains full rubric with guidance. Student view si empty until signed off.
  grade: (assignmentId: number) =>
    apiFetch<AssignmentGrade>(`/assignments/${assignmentId}/grade`),
  // Instructor adds or replaces scores and returns the updated grade
  saveScores: (assignmentId: number, scores: RubricScoreInput[]) =>
    apiFetch<AssignmentGrade>(`/assignments/${assignmentId}/rubric-scores`, {
      method: "PUT",
      body: JSON.stringify({ scores }),
    }),
};
