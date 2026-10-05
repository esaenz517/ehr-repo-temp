import { useState } from "react";
import logo from "../../images/UTEP-Logo.png";
import "./sidebar.css";

export type View =
  | "home"
  | "items"
  | "patients"
  | "staff"
  | "providers"
  | "drugs"
  | "rooms"
  | "courses"
  | "createCase"
  | "assignments"
  | "assignedCases"
  | "clinicalNotes";
interface SidebarProps {
  active: View;
  onNavigate: (view: View) => void;
  username: string;
  onLogout: () => void;
  allowedViews?: View[]; // student can only see some vi
}

//View for student roles
export const STUDENT_VIEWS: View[] = ["home", "assignments"];

const COLLAPSED_KEY = "sidebar-collapsed";

// Remember collapsed/expanded across refreshes; storage can be blocked, so fail quietly
function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function saveCollapsed(value: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, String(value));
  } catch {
    // ignore
  }
}

const NAV_ITEMS: { view: View; label: string }[] = [
  //{ view: "home", label: "Home" },
  //{ view: "items", label: "Items" },
  { view: "patients", label: "Patients" },
  { view: "staff", label: "Staff" },
  { view: "providers", label: "Providers" },
  { view: "drugs", label: "Drugs" },
  { view: "rooms", label: "Rooms" },
  { view: "courses", label: "Courses" },
  { view: "createCase", label: "Create Case" },
  { view: "assignments", label: "My Assignments" },
  { view: "assignedCases", label: "Assigned Cases" },
  { view: "clinicalNotes", label: "Clinical Notes" },
];

export function Sidebar({ active, onNavigate, username, onLogout, allowedViews }: SidebarProps) {
    const items = allowedViews
    ? NAV_ITEMS.filter(({ view }) => allowedViews.includes(view))
    : NAV_ITEMS;
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      saveCollapsed(!prev);
      return !prev;
    });
  };

  return (
    <nav className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      <div className="sidebar-brand">
        <img className="sidebar-logo" src={logo} alt="UTEP logo" />
        <span className="sidebar-title">EMR</span>
      </div>

      <ul className="sidebar-nav">
        {items.map(({ view, label }) => (
          <li key={view}>
            <button
              className={`sidebar-link${active === view ? " sidebar-link--active" : ""}`}
              aria-current={active === view ? "page" : undefined}
              onClick={() => onNavigate(view)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        <span className="sidebar-user">{username}</span>
        <button className="sidebar-logout" onClick={onLogout}>Log out</button>
      </div>

      <button
        className="sidebar-toggle"
        onClick={toggleCollapsed}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <span className="sidebar-toggle-icon" aria-hidden="true">{collapsed ? "»" : "«"}</span>
        <span className="sidebar-toggle-label">Collapse</span>
      </button>
    </nav>
  );
}