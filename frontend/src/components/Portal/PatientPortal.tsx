import { useState } from "react";
import { PATIENT_VIEWS, roleLabel, type View } from "../../access";
import type { LoginResponse } from "../../types";
import { Sidebar } from "../Sidebar/Sidebar";
import { PortalAppointments } from "./PortalAppointments";
import { PortalBilling } from "./PortalBilling";
import { PortalHealth } from "./PortalHealth";
import { PortalHistory } from "./PortalHistory";
import { PortalHome } from "./PortalHome";
import { PortalResults } from "./PortalResults";

interface PatientPortalProps {
  user: LoginResponse;
  onLogout: () => void;
}

// The whole app for a patient portal account: same sidebar and look as the
// staff app, but only the patient's own pages (PATIENT_VIEWS).
export function PatientPortal({ user, onLogout }: PatientPortalProps) {
  const [view, setView] = useState<View>("portalHome");
  const navigate = (next: View) => setView(PATIENT_VIEWS.includes(next) ? next : "portalHome");
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;

  return (
    <div className="app-layout">
      <Sidebar
        active={view}
        username={name}
        role={roleLabel(user)}
        subtitle="Patient portal"
        allowedViews={PATIENT_VIEWS}
        onNavigate={navigate}
        onLogout={onLogout}
      />

      <main className="app-main">
        {view === "portalHome" && <PortalHome onNavigate={navigate} />}
        {view === "portalAppointments" && <PortalAppointments />}
        {view === "portalHistory" && <PortalHistory />}
        {view === "portalHealth" && <PortalHealth />}
        {view === "portalResults" && <PortalResults />}
        {view === "portalBilling" && <PortalBilling />}
      </main>
    </div>
  );
}
