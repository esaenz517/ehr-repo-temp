interface HomeProps  {
  isStudent?: boolean;
}

export function Home ({ isStudent = false}: HomeProps){
  return (
    <div>
      <h1>Home</h1>
      <p>
        {isStudent
        ? "Open My Assignments to see the cases assigned to you."
        : "Pick a feature from the sidebar to view and manage its data."}
      </p>
    </div>
  );
}
