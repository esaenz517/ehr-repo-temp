
import { useState } from "react";
import logo from "../../images/UTEP-Logo.png";
import "./sidebar.css";

// All available pages in the application.
export type View =
  | "home"
  | "patients"
  | "staff"
  | "providers"
  | "drugs"
  | "rooms"
  | "courses"
  | "createCase"
  | "assignments"
  | "assignedCases"
  | "clinicalNotes"
  | "grades"
  | "progress";

interface SidebarProps {
  active: View;
  onNavigate: (view: View) => void;
  username: string;
  onLogout: () => void;
  allowedViews?: View[];

  // Number of inactive or overdue assignments.
  progressAlertCount?: number;
}

// Students can access their dashboard, assignments,
// and published grades.
export const STUDENT_VIEWS: View[] = [
  "home",
  "assignments",
  "grades",
];

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

// Navigation entries displayed based on the user's role.
const NAV_ITEMS: { view: View; label: string }[] = [
  { view: "home", label: "Dashboard" },
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

  // Student grading and instructor progress features.
  { view: "grades", label: "My Grades" },
  { view: "progress", label: "Student Progress" },
];

export function Sidebar({
  active,
  onNavigate,
  username,
  onLogout,
  allowedViews,
  progressAlertCount = 0,
}: SidebarProps) {

  // Students see only their approved pages.
  // Staff see the management pages and Student Progress.
  const items = allowedViews
    ? NAV_ITEMS.filter(({ view }) =>
      allowedViews.includes(view)
    )
    : NAV_ITEMS.filter(
      ({ view }) =>
        view !== "home" && view !== "grades"
    );

  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleCollapsed = () => {
    setCollapsed((previous) => {
      saveCollapsed(!previous);
      return !previous;
    });
  };

  return (
    <nav
      className={`sidebar${collapsed ? " sidebar--collapsed" : ""
        }`}
    >
      <div className="sidebar-brand">
        <img
          className="sidebar-logo"
          src={logo}
          alt="UTEP logo"
        />

        <span className="sidebar-title">
          EMR
        </span>
      </div>

      <ul className="sidebar-nav">
        {items.map(({ view, label }) => (
          <li key={view}>
            <button
              className={`sidebar-link${active === view
                ? " sidebar-link--active"
                : ""
                }`}
              aria-current={
                active === view ? "page" : undefined
              }
              onClick={() => onNavigate(view)}
            >
              <span>{label}</span>

              {/* Show alerts on Student Progress. */}
              {view === "progress" &&
                progressAlertCount > 0 && (
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

      <div className="sidebar-footer">
        <span className="sidebar-user">
          {username}
        </span>

        <button
          className="sidebar-logout"
          onClick={onLogout}
        >
          Log out
        </button>
      </div>

      <button
        className="sidebar-toggle"
        onClick={toggleCollapsed}
        aria-expanded={!collapsed}
        aria-label={
          collapsed
            ? "Expand sidebar"
            : "Collapse sidebar"
        }
        title={
          collapsed
            ? "Expand sidebar"
            : "Collapse sidebar"
        }
      >
        <span
          className="sidebar-toggle-icon"
          aria-hidden="true"
        >
          {collapsed ? "»" : "«"}
        </span>

        <span className="sidebar-toggle-label">
          Collapse
        </span>
      </button>
    </nav>
  );
}
