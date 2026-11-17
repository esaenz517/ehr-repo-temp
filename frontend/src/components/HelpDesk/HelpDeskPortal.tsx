import { HELP_DESK_VIEWS, roleLabel } from "../../access";
import type { LoginResponse } from "../../types";
import { Sidebar } from "../Sidebar/Sidebar";
import { HelpDeskBoard } from "./HelpDeskBoard";

interface HelpDeskPortalProps {
  user: LoginResponse;
  onLogout: () => void;
}

// The whole app for a help desk account: same sidebar and look as the staff
// app, but only the help desk board (HELP_DESK_VIEWS).
export function HelpDeskPortal({ user, onLogout }: HelpDeskPortalProps) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;

  return (
    <div className="app-layout">
      <Sidebar
        active="helpDesk"
        username={name}
        role={roleLabel(user)}
        subtitle="Help desk portal"
        allowedViews={HELP_DESK_VIEWS}
        onNavigate={() => {}}
        onLogout={onLogout}
      />

      <main className="app-main">
        <HelpDeskBoard />
      </main>
    </div>
  );
}
