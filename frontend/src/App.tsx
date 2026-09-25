import { useState } from "react";
import { DrugsPage } from "./components/DrugsPage";
import { Home } from "./components/Home";
import { ItemsPage } from "./components/ItemsPage";
import { PatientsPage } from "./components/PatientsPage";
import { StaffPage } from "./components/StaffPage";
import { ProvidersPage } from "./components/ProvidersPage";
import { Sidebar, View } from "./components/Sidebar";
import { LoginPage } from "./components/LoginPage";
import type { LoginResponse } from "./types";

function App() {
  const [view, setView] = useState<View>("home");
  const [user, setUser] = useState<LoginResponse | null>(null);

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <div className="app-layout">
      <Sidebar active={view} onNavigate={setView} username={user.username}
  onLogout={() => {
    setUser(null);
    setView("home");
  }}
/>

      <main className="app-main">
        {view === "home" && <Home />}
        {view === "items" && <ItemsPage />}
        {view === "patients" && <PatientsPage />}
        {view === "staff" && <StaffPage />}
        {view === "providers" && <ProvidersPage />}
        {view === "drugs" && <DrugsPage />}
      </main>
    </div>
  );
}

export default App;
