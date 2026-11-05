import { useState } from "react";
import { StaffForm } from "./Staff/StaffForm";
import { StaffList } from "./Staff/StaffList";

import { StudentBatchImport } from "./Staff/StudentBatchImport";
import { StudentCreateForm } from "./Staff/StudentCreateForm";

import { useStaff } from "../hooks/useStaff";
import { PageHeader } from "./PageHeader";
import { Panel } from "./Panel";


type RoleFilter = "all" | "admin" | "student" | "staff";

// Which add form is open under the page header (only one at a time)
type OpenForm = "staff" | "student" | "import" | null;

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All roles" },
  { value: "admin", label: "Admins" },
  { value: "student", label: "Students" },
  { value: "staff", label: "Other staff" },
];


interface StaffPageProps {
  canBatchImport?: boolean;
}


export function StaffPage({
  canBatchImport = false,
}: StaffPageProps) {
  const {
    staff,
    loading,
    error,
    create,
    update,
    remove,
    reload,
  } = useStaff();
  const [search, setSearch] = useState(""); // matches the full name
  const [role, setRole] = useState<RoleFilter>("all");
  const [specialization, setSpecialization] = useState("all"); // "all" or one specialization
  const [openForm, setOpenForm] = useState<OpenForm>(null);

  // Header buttons toggle their form; opening one closes the others
  const toggleForm = (form: Exclude<OpenForm, null>) => setOpenForm((open) => (open === form ? null : form));
  const formButton = (form: Exclude<OpenForm, null>, label: string, primary = false) => (
    <button
      type="button"
      className={primary ? "ui-button" : "ui-button ui-button--secondary"}
      aria-expanded={openForm === form}
      onClick={() => toggleForm(form)}
    >
      {openForm === form ? "Close form" : label}
    </button>
  );

  // Every specialization some staff member has, A to Z
  const specializationOptions = [...new Set(staff.map((m) => m.specialization).filter(Boolean))].sort();

  const query = search.trim().toLowerCase();
  const shown = staff.filter(
    (m) =>
      (!query ||
        [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(" ").toLowerCase().includes(query)) &&
      (role === "all" ||
        (role === "admin" && m.admin) ||
        (role === "student" && m.student) ||
        (role === "staff" && !m.admin && !m.student)) &&
      (specialization === "all" || m.specialization === specialization)
  );

  const filtering = query !== "" || role !== "all" || specialization !== "all";
  const clearFilters = () => {
    setSearch("");
    setRole("all");
    setSpecialization("all");
  };


  return (
    <div className="ui-page">
      <PageHeader
        title="Staff"
        description="Manage instructors, administrators and student accounts."
        actions={
          <>
            {canBatchImport && formButton("import", "Import students")}
            {canBatchImport && formButton("student", "New student")}
            {formButton("staff", "New staff member", true)}
          </>
        }
      />

      {/* Student account management (admins only) */}
      {canBatchImport && openForm === "student" && <StudentCreateForm onCreated={reload} />}
      {canBatchImport && openForm === "import" && <StudentBatchImport onImported={reload} />}

      {openForm === "staff" && <StaffForm onSubmit={create} onCancel={() => setOpenForm(null)} />}

      {error && <p className="ui-error">{error}</p>}

      <Panel
        flush
        toolbar={
          <div className="ui-filter-bar" role="search" aria-label="Filter staff">
            <label className={`ui-filter-field${query ? " ui-filter-field--active" : ""}`}>
              <span className="ui-filter-label">Search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name"
                className="ui-input"
              />
            </label>

            <label className={`ui-filter-field${role !== "all" ? " ui-filter-field--active" : ""}`}>
              <span className="ui-filter-label">Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value as RoleFilter)} className="ui-input">
                {ROLE_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </label>

            <label className={`ui-filter-field${specialization !== "all" ? " ui-filter-field--active" : ""}`}>
              <span className="ui-filter-label">Specialization</span>
              <select value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="ui-input">
                <option value="all">All specializations</option>
                {specializationOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            {filtering && (
              <button type="button" className="ui-button ui-button--secondary ui-filter-clear" onClick={clearFilters}>
                Clear filters
              </button>
            )}

            <div className="ui-filter-summary">
              {!loading && (
                <span aria-live="polite">
                  Showing <strong>{shown.length}</strong> of {staff.length} staff member{staff.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        }
      >
        {loading ? (
          <p className="ui-row-empty">Loading staff…</p>
        ) : (
          <StaffList
            staff={shown}
            emptyText={staff.length > 0 ? "No staff match these filters." : "No staff yet."}
            onUpdate={update}
            onDelete={remove}
          />
        )}
      </Panel>
    </div>
  );
}
