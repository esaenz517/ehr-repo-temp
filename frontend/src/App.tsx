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
import { Sidebar, View, canView } from "./components/Sidebar";
import { LoginPage } from "./components/LoginPage";
import { loginApi } from "./api/login";
import { SESSION_EXPIRED_EVENT } from "./api/client";
import type { LoginResponse } from "./types";
import { MyAssignmentsPage } from "./components/Assignment/MyAssignmentsPage";
import { ClinicalNotesPage } from "./components/ClinicalNotes/ClinicalNotesPage";

function App() {
  const [view, setView] = useState<View>("home");
  const [user, setUser] = useState<LoginResponse | null>(null);
  // True until we know whether the session cookie from a previous visit is still valid.
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    loginApi
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setView("home");
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const handleLogout = async () => {
    try {
      await loginApi.logout();
    } finally {
      setUser(null);
      setView("home");
    }
  };

  if (checkingSession) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  const show = (v: View) => view === v && canView(v, user.roles);

  return (
    <div className="app-layout">
      <Sidebar active={view} onNavigate={setView} username={user.username}
        roles={user.roles} onLogout={handleLogout}
      />

      <main className="app-main">
        {show("home") && <Home />}
        {show("items") && <ItemsPage />}
        {show("patients") && <PatientsPage />}
        {show("staff") && <StaffPage />}
        {show("providers") && <ProvidersPage />}
        {show("drugs") && <DrugsPage />}
        {show("rooms") && <RoomsPage />}
        {show("courses") && <CoursesPage />}
        {show("createCase") && <CreateCasePage staffId={user.staffid} />}
        {show("assignments") && <MyAssignmentsPage studentId={user.staffid} />}
        {show("clinicalNotes") && <ClinicalNotesPage />}
      </main>
    </div>
  );
}

export default App;
