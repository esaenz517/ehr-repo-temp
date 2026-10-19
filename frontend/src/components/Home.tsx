import type { Assignment } from "../types";
import { InstructorDashboard } from "./Dashboard/InstructorDashboard";
import { StudentDashboard } from "./Dashboard/StudentDashboard";

interface HomeProps  {
  isStudent?: boolean;
  username: string;
  staffId: number;
  onOpenAssignment: (assignment: Assignment) => void;
  onViewAssignments: () => void;
  onReviewAssignment: (assignment: Assignment) => void; // instructor opens a student's note
}

export function Home ({ isStudent = false, username, staffId, onOpenAssignment, onViewAssignments, onReviewAssignment }: HomeProps){
  if (isStudent) {
    return (
      <StudentDashboard
        username={username}
        studentId={staffId}
        onOpen={onOpenAssignment}
        onViewAll={onViewAssignments}
      />
    );
  }

  return <InstructorDashboard staffId={staffId} onReview={onReviewAssignment} />;
}