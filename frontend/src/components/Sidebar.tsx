export type View = "home" | "items" | "patients" | "providers" | "drugs";

interface SidebarProps {
  active: View;
  onNavigate: (view: View) => void;
}

const NAV_ITEMS: { view: View; label: string }[] = [
  { view: "home", label: "Home" },
  { view: "items", label: "Items" },
  { view: "patients", label: "Patients" },
  { view: "providers", label: "Providers" },
  { view: "drugs", label: "Drugs" },
];

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <nav className="sidebar">
      <ul>
        {NAV_ITEMS.map(({ view, label }) => (
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
    </nav>
  );
}
