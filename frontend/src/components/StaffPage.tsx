import { useState } from "react";
import { StaffForm } from "./Staff/StaffForm";
import { StaffList } from "./Staff/StaffList";

import { StudentBatchImport } from "./Staff/StudentBatchImport";
import { StudentCreateForm } from "./Staff/StudentCreateForm";

import { useReferenceData } from "../hooks/useReferenceData";
import { useStaff } from "../hooks/useStaff";
import type { RoleName } from "../types";
import { PageHeader } from "./PageHeader";
import { Panel } from "./Panel";


// Which add form is open under the page header (only one at a time)
type OpenForm = "staff" | "student" | "import" | null;

const ROLE_FILTERS: { value: "all" | RoleName; label: string }[] = [
  { value: "all", label: "All roles" },
  { value: "ADMIN", label: "Administrators" },
  { value: "FACULTY_INSTRUCTOR", label: "Instructors" },
  { value: "STUDENT", label: "Students" },
];


interface StaffPageProps {
  permissions: string[]; // the signed-in person's permission codes
}


export function StaffPage({ permissions }: StaffPageProps) {
  const has = (code: string) => permissions.includes(code);
  const canCreate = has("staff.create");
  const canEdit = has("staff.update");
  const canDelete = has("staff.delete");
  const canChangeRole = has("user.manage_roles");
  // Student accounts need an account, a person, and a role at once
  const canCreateStudents = canCreate && has("user.create") && canChangeRole;

  const {
    staff,
    loading,
    error,
    create,
    update,
    setRole,
    remove,
    reload,
  } = useStaff();
  const { departments, disciplines, roles } = useReferenceData({ withRoles: canCreate || canChangeRole });

  const [search, setSearch] = useState(""); // matches the full name
  const [role, setRoleFilter] = useState<"all" | RoleName>("all");
  const [department, setDepartment] = useState("all"); // "all", "none", or a department id
  const [discipline, setDiscipline] = useState("all"); // "all", "none", or a discipline id
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

  const matches = (value: number | null, filter: string) =>
    filter === "all" || (filter === "none" ? value === null : value === Number(filter));

  const query = search.trim().toLowerCase();
  const shown = staff.filter(
    (m) =>
      (!query ||
        [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(" ").toLowerCase().includes(query)) &&
      (role === "all" || m.role_name === role) &&
      matches(m.department_id, department) &&
      matches(m.discipline_id, discipline)
  );

  const filtering = query !== "" || role !== "all" || department !== "all" || discipline !== "all";
  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setDepartment("all");
    setDiscipline("all");
  };


  return (
    <div className="ui-page">
      <PageHeader
        title="Staff"
        description="Instructors, administrators, and students, with their role, department, and discipline."
        actions={
          <>
            {canCreateStudents && formButton("import", "Import students")}
            {canCreateStudents && formButton("student", "New student")}
            {canCreate && formButton("staff", "New staff member", true)}
          </>
        }
      />

      {/* Student account management (admins only) */}
      {canCreateStudents && openForm === "student" && (
        <StudentCreateForm departments={departments} disciplines={disciplines} onCreated={reload} />
      )}
      {canCreateStudents && openForm === "import" && <StudentBatchImport onImported={reload} />}

      {canCreate && openForm === "staff" && (
        <StaffForm
          roles={roles}
          departments={departments}
          disciplines={disciplines}
          onSubmit={create}
          onCancel={() => setOpenForm(null)}
        />
      )}

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
              <select value={role} onChange={(e) => setRoleFilter(e.target.value as "all" | RoleName)} className="ui-input">
                {ROLE_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </label>

            <label className={`ui-filter-field${department !== "all" ? " ui-filter-field--active" : ""}`}>
              <span className="ui-filter-label">Department</span>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="ui-input">
                <option value="all">All departments</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>{d.name}</option>
                ))}
                <option value="none">No department</option>
              </select>
            </label>

            <label className={`ui-filter-field${discipline !== "all" ? " ui-filter-field--active" : ""}`}>
              <span className="ui-filter-label">Discipline</span>
              <select value={discipline} onChange={(e) => setDiscipline(e.target.value)} className="ui-input">
                <option value="all">All disciplines</option>
                {disciplines.map((d) => (
                  <option key={d.discipline_id} value={d.discipline_id}>{d.name}</option>
                ))}
                <option value="none">No discipline</option>
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
                  Showing <strong>{shown.length}</strong> of {staff.length} {staff.length === 1 ? "person" : "people"}
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
            roles={roles}
            departments={departments}
            disciplines={disciplines}
            canEdit={canEdit}
            canDelete={canDelete}
            canChangeRole={canChangeRole && roles.length > 0}
            onUpdate={update}
            onSetRole={setRole}
            onDelete={remove}
          />
        )}
      </Panel>
    </div>
  );
}

