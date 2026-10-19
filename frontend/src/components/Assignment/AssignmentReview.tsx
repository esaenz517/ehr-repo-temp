import { useState } from "react";
import type { Assignment, EncounterStatus } from "../../types";
import { InstructorFeedback } from "./InstructorFeedback";
import { RubricScoring } from "./RubricScoring";

//AI was used to assist in building this section as dev assigned to it is
// unfamiliar with frontend development.

interface AssignmentReviewProps {
  assignment: Assignment;
  error?: string | null;
  onSaveFeedback: (feedback: string) => Promise<boolean>;
  onDecision: (status: EncounterStatus, feedback: string) => Promise<boolean>;
}

// Everything the instructor does under a student's note: score the rubric, write feedback,
// then sign off or send back. Sign off waits until every rubric item is scored and saved.
export function AssignmentReview({ assignment, error, onSaveFeedback, onDecision }: AssignmentReviewProps) {
  const [signOffBlocked, setSignOffBlocked] = useState<string | null>(null);

  return (
    <>
      <RubricScoring assignment={assignment} onSignOffBlocked={setSignOffBlocked} />
      <InstructorFeedback
        assignment={assignment}
        error={error}
        signOffBlocked={signOffBlocked}
        onSave={onSaveFeedback}
        onDecision={onDecision}
      />
    </>
  );
}
