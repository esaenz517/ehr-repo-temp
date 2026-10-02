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
  | "clinicalNotes";

// Role names from dbo.Roles.
const ADMIN = "ADMIN";
const INSTRUCTOR = "FACULTY_INSTRUCTOR";
const STUDENT = "STUDENT";

interface SidebarProps {
  active: View;
  onNavigate: (view: View) => void;
  username: string;
  roles: string[];
  onLogout: () => void;
}

// roles: who sees the view (ADMIN always does); leave it out for everyone.
// This only hides navigation; the backend still enforces permissions.
const NAV_ITEMS: { view: View; label: string; roles?: string[] }[] = [
  { view: "home", label: "Home" },
  //{ view: "items", label: "Items", roles: [] },
  { view: "patients", label: "Patients", roles: [INSTRUCTOR] },
  { view: "staff", label: "Staff", roles: [] },
  { view: "providers", label: "Providers", roles: [INSTRUCTOR] },
  { view: "drugs", label: "Drugs", roles: [INSTRUCTOR] },
  { view: "rooms", label: "Rooms", roles: [INSTRUCTOR] },
  { view: "courses", label: "Courses", roles: [INSTRUCTOR] },
  { view: "createCase", label: "Create Case", roles: [INSTRUCTOR] },
  
  { view: "clinicalNotes", label: "Clinical Notes", roles: [INSTRUCTOR, STUDENT] },
  { view: "assignments", label: "My Assignments", roles: [STUDENT] },
];

export function canView(view: View, roles: string[]): boolean {
  const item = NAV_ITEMS.find((i) => i.view === view);
  if (!item) return false;
  if (!item.roles || roles.includes(ADMIN)) return true;
  return item.roles.some((role) => roles.includes(role));
}

export function Sidebar({ active, onNavigate, username, roles, onLogout }: SidebarProps) {
  return (
    <nav className="sidebar">
      <ul>
        {NAV_ITEMS.filter(({ view }) => canView(view, roles)).map(({ view, label }) => (
          <li key={view}>
            <button
              onClick={() => onNavigate(view)}
              style={{
                background: active === view ? "#e8e8e8" : "transparent",
                fontWeight: active === view ? 600 : 400,
              }}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>

      <p>{username}</p>
      <button onClick={onLogout}>Log out</button>
    </nav>
  );
}
