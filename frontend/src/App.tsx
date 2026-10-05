import { useEffect, useState } from "react";
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
import { loginApi } from "./api/login";
import type { Assignment, LoginResponse } from "./types";
import { MyAssignmentsPage } from "./components/Assignment/MyAssignmentsPage";
import { AssignedCasesPage } from "./components/Assignment/AssignedCasesPage";
import { ClinicalNotesPage } from "./components/ClinicalNotes/ClinicalNotesPage";
import { CaseWorkspacePage } from "./components/Assignment/CaseWorkspacePage";

function App() {
  const [view, setView] = useState<View>("home");
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Restore the signed-in user from the session cookie after a page refresh
  useEffect(() => {
    loginApi.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false));
  }, []);

  const [openAssignment, setOpenAssignment] = useState<Assignment | null>(null); // Case opens from My Assignments list

  if (checkingSession) {
    return null;
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }
  // Students who are only students get to see Home and My Assignments
  const allowedViews = user.student && !user.admin ? STUDENT_VIEWS : undefined;
  const canView = (v: View) => !allowedViews || allowedViews.includes(v);

  return (
    <div className="app-layout">
      <Sidebar active={view} username={user.username}
        onNavigate={(v) => {
          setOpenAssignment(null); // Clicking out of a case closes it
          setView(v);
        }}
        allowedViews={allowedViews}
        onLogout={() => {
          loginApi.logout()
            .catch(() => {}) // sign out locally even if the server call fails
            .finally(() => {
              setUser(null);
              setView("home");
            });
          setUser(null);
          setOpenAssignment(null);
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
        {view === "assignments" &&
          (openAssignment ? (
            <CaseWorkspacePage assignment={openAssignment} onBack={() => setOpenAssignment(null)} />
          ) : (
            <MyAssignmentsPage studentId={user.staffid} onOpen={setOpenAssignment} />
          ))}
        {view === "assignedCases" && canView("assignedCases") && <AssignedCasesPage staffId={user.staffid} />}
        {view === "clinicalNotes" && canView("clinicalNotes") && <ClinicalNotesPage />}
      </main>
    </div>
  );
}

export default App;
