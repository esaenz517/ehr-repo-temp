import { useState } from "react";
import { CreateCasePage } from "./components/CreateCasePage";
import { DrugsPage } from "./components/DrugsPage";
import { Home } from "./components/Home";
import { ItemsPage } from "./components/ItemsPage";
import { PatientsPage } from "./components/PatientsPage";
import { StaffPage } from "./components/StaffPage";
import { ProvidersPage } from "./components/ProvidersPage";
import { RoomsPage } from "./components/RoomsPage";
import { CoursesPage } from "./components/CoursesPage";
import { Sidebar, STUDENT_VIEWS, View } from "./components/Sidebar/Sidebar";
import { LoginPage } from "./components/Login/LoginPage";
import type { LoginResponse } from "./types";
import { MyAssignmentsPage } from "./components/Assignment/MyAssignmentsPage";
import { AssignedCasesPage } from "./components/Assignment/AssignedCasesPage";
import { ClinicalNotesPage } from "./components/ClinicalNotes/ClinicalNotesPage";

function App() {
  const [view, setView] = useState<View>("home");
  const [user, setUser] = useState<LoginResponse | null>(null);

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }
  // Students who are only students get to see Home and My Assignments
  const allowedViews = user.student && !user.admin ? STUDENT_VIEWS : undefined;
  const canView = (v: View) => !allowedViews || allowedViews.includes(v);

  return (
    <div className="app-layout">
      <Sidebar active={view} onNavigate={setView} username={user.username}
        allowedViews={allowedViews}
        onLogout={() => {
          setUser(null);
          setView("home");
        }}
      />

      <main className="app-main">
        {view === "home" && <Home isStudent={!!allowedViews} />}
        {view === "items" && canView("items") && <ItemsPage />}
        {view === "patients" && canView("patients") && <PatientsPage />}
        {view === "staff" && canView("staff") && <StaffPage />}
        {view === "providers" && canView("providers") && <ProvidersPage />}
        {view === "drugs" && canView("drugs") && <DrugsPage />}
        {view === "rooms" && canView("rooms") && <RoomsPage />}
        {view === "courses" && canView("courses") && <CoursesPage />}
        {view === "createCase" && canView("createCase") && <CreateCasePage staffId={user.staffid} />}
        {view === "assignments" && <MyAssignmentsPage studentId={user.staffid} />}
        {view === "assignedCases" && canView("assignedCases") && <AssignedCasesPage staffId={user.staffid} />}
        {view === "clinicalNotes" && canView("clinicalNotes") && <ClinicalNotesPage />}
      </main>
    </div>
  );
}

export default App;
