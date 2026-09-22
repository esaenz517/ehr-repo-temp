import { useState } from "react";
import { Home } from "./components/Home";
import { ItemsPage } from "./components/ItemsPage";
import { PatientsPage } from "./components/PatientsPage";
import { StaffPage } from "./components/StaffPage";
import { Sidebar, View } from "./components/Sidebar";

function App() {
  const [view, setView] = useState<View>("home");

  return (
    <div className="app-layout"> 
      <Sidebar active={view} onNavigate={setView} />

      <main className="app-main">
        {view === "home" && <Home />}
        {view === "items" && <ItemsPage />}
        {view === "patients" && <PatientsPage />}
        {view === "staff" && <StaffPage />}
      </main>
    </div>
  );
}

export default App;
