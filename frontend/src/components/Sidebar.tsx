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

export const STUDENT_VIEWS: View[] = ["home", "assignments"];

const NAV_ITEMS: { view: View; label: string }[] = [
  { view: "home", label: "Home" },
  { view: "items", label: "Items" },
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

  return (
    <nav className="sidebar">
      <ul>
        {items.map(({ view, label }) => (
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