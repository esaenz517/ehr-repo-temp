import { FRONT_DESK_VIEWS, roleLabel } from "../../access";
import type { LoginResponse } from "../../types";
import { Sidebar } from "../Sidebar/Sidebar";
import { FrontDeskBoard } from "./FrontDeskBoard";

interface FrontDeskPortalProps {
  user: LoginResponse;
  onLogout: () => void;
}

// The whole app for a front desk account: same sidebar and look as the staff
// app, but only the front desk board (FRONT_DESK_VIEWS).
export function FrontDeskPortal({ user, onLogout }: FrontDeskPortalProps) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;

  return (
    <div className="app-layout">
      <Sidebar
        active="frontDesk"
        username={name}
        role={roleLabel(user)}
        subtitle="Front desk portal"
        allowedViews={FRONT_DESK_VIEWS}
        onNavigate={() => {}}
        onLogout={onLogout}
      />

      <main className="app-main">
        <FrontDeskBoard />
      </main>
    </div>
  );
}
