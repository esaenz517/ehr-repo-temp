import { useState } from "react";
import { StaffForm } from "./Staff/StaffForm";
import { StaffList } from "./Staff/StaffList";

import { StudentBatchImport } from "./Staff/StudentBatchImport";
import { StudentCreateForm } from "./Staff/StudentCreateForm";

import { useStaff } from "../hooks/useStaff";


type RoleFilter = "all" | "admin" | "student" | "staff";

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
      <h1 className="ui-page-title">
        Staff Management
      </h1>

      {/* Student account management */}
      {canBatchImport && (
        <>
          <StudentCreateForm
            onCreated={reload}
          />

          <StudentBatchImport
            onImported={reload}
          />
        </>
      )}

      {/* Existing manual staff creation */}
      <h2>
        Add Staff Member
      </h2>

      <StaffForm
        onSubmit={create}
      />

      {/* Existing Staff listing */}
      <h2>
        Staff Directory
      </h2>

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

      {error && (
        <p className="ui-error">
          {error}
        </p>
      )}

      {loading ? (
        <p className="ui-muted">
          Loading...
        </p>
      ) : (
        <StaffList
          staff={shown}
          emptyText={staff.length > 0 ? "No staff match these filters." : "No staff yet."}
          onUpdate={update}
          onDelete={remove}
        />
      )}
    </div>
  );
}