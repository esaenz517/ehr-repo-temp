import type { Assignment } from "../types";
import { StudentDashboard } from "./Dashboard/StudentDashboard";

interface HomeProps  {
  isStudent?: boolean;
  username: string;
  staffId: number;
  onOpenAssignment: (assignment: Assignment) => void;
  onViewAssignments: () => void;
}

export function Home ({ isStudent = false, username, staffId, onOpenAssignment, onViewAssignments }: HomeProps){
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

  return (
    <div>
      <h1>Home</h1>
      <p>Pick a feature from the sidebar to view and manage its data.</p>
    </div>
  );
}