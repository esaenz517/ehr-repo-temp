
import { useEffect, useRef, useState } from "react";
import logo from "../../images/UTEP-Logo.png";
import "./sidebar.css";

import type { View } from "../../access";

// View and STUDENT_VIEWS live in access.ts (with the rest of the access rules);
// re-exported here for existing imports.
export type { View } from "../../access";
export { STUDENT_VIEWS } from "../../access";

interface SidebarProps {
  active: View;
  onNavigate: (view: View) => void;
  username: string;
  role?: string; // shown under the username, e.g. "Student · Nursing"
  onLogout: () => void;
  allowedViews?: View[];

  // Number of inactive or overdue assignments.
  progressAlertCount?: number;
}

const COLLAPSED_KEY = "sidebar-collapsed";

// Restore the sidebar's previous collapsed state.
function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

// Save the collapsed state between page refreshes.
function saveCollapsed(value: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, String(value));
  } catch {
    // Ignore if browser storage is unavailable.
  }
}

// Navigation entries, grouped under small section labels. A group only
// shows when the user can see at least one of its pages.
type NavGroup = "Overview" | "Teaching" | "Records" | "Coursework";

const NAV_ITEMS: { view: View; label: string; group: NavGroup }[] = [
  { view: "home", label: "Dashboard", group: "Overview" }, // student or instructor dashboard, picked in Home.tsx

  { view: "createCase", label: "Create Case", group: "Teaching" },
  { view: "assignedCases", label: "Assigned Cases", group: "Teaching" },
  { view: "progress", label: "Student Progress", group: "Teaching" },

  { view: "patients", label: "Patients", group: "Records" },
  { view: "clinicalNotes", label: "Clinical Notes", group: "Records" },
  { view: "providers", label: "Providers", group: "Records" },
  { view: "rooms", label: "Rooms", group: "Records" },
  { view: "staff", label: "Staff", group: "Records" },
  { view: "courses", label: "Courses", group: "Records" },

  { view: "assignments", label: "My Assignments", group: "Coursework" },
  { view: "grades", label: "My Grades", group: "Coursework" },
];

const GROUP_ORDER: NavGroup[] = ["Overview", "Teaching", "Records", "Coursework"];

export function Sidebar({
  active,
  onNavigate,
  username,
  role,
  onLogout,
  allowedViews,
  progressAlertCount = 0,
}: SidebarProps) {

  // Students see only their approved pages.
  // Staff see everything except My Grades (grades are published to students)
  // and My Assignments (hidden for now; swap the filter lines below to show it again).
  const items = allowedViews
    ? NAV_ITEMS.filter(({ view }) => allowedViews.includes(view))
    // : NAV_ITEMS.filter(({ view }) => view !== "grades");
    : NAV_ITEMS.filter(({ view }) => view !== "grades" && view !== "assignments");

  const [collapsed, setCollapsed] = useState(readCollapsed);

  // Profile menu (holds Log out). Closes on an outside click or Escape.
  const [menuOpen, setMenuOpen] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!footerRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const toggleCollapsed = () => {
    setCollapsed((previous) => {
      saveCollapsed(!previous);
      return !previous;
    });
  };

  return (
    <nav
      className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}
      aria-label="Main"
    >
      <div className="sidebar-brand">
        <img className="sidebar-logo" src={logo} alt="UTEP logo" />
        <span className="sidebar-title">
          EMR
          <span className="sidebar-subtitle">Training system</span>
        </span>
      </div>

      <div className="sidebar-nav">
        {GROUP_ORDER.map((group) => {
          const groupItems = items.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;
          return (
            <div key={group} className="sidebar-group">
              {group !== "Overview" && <p className="sidebar-group-label">{group}</p>}
              <ul className="sidebar-list">
                {groupItems.map(({ view, label }) => (
                  <li key={view}>
                    <button
                      className={`sidebar-link${active === view ? " sidebar-link--active" : ""}`}
                      aria-current={active === view ? "page" : undefined}
                      onClick={() => onNavigate(view)}
                    >
                      <span>{label}</span>

                      {/* Show alerts on Student Progress. */}
                      {view === "progress" && progressAlertCount > 0 && (
                        <span
                          className="sidebar-progress-count"
                          aria-label={`${progressAlertCount} assignments need attention`}
                        >
                          {progressAlertCount}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer" ref={footerRef}>
        {menuOpen && (
          <div className="sidebar-menu" id="sidebar-profile-menu" role="menu">
            <button type="button" className="sidebar-menu-item" role="menuitem" onClick={onLogout}>
              Log out
            </button>
          </div>
        )}

        <button
          type="button"
          className={`sidebar-user${menuOpen ? " sidebar-user--open" : ""}`}
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls="sidebar-profile-menu"
        >
          <span className="sidebar-avatar" aria-hidden="true">
            {username.charAt(0).toUpperCase()}
          </span>
          <span className="sidebar-user-text">
            <span className="sidebar-user-name">{username}</span>
            {role && <span className="sidebar-user-role">{role}</span>}
          </span>
          <svg className="sidebar-user-chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path d="M4 10l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <button
        className="sidebar-toggle"
        onClick={toggleCollapsed}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <span className="sidebar-toggle-icon" aria-hidden="true">
          {collapsed ? "»" : "«"}
        </span>
        <span className="sidebar-toggle-label">Collapse</span>
      </button>
    </nav>
  );
}
