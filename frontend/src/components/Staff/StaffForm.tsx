import { FormEvent, useEffect, useState } from "react";

import type { CreateStaffInput } from "../../api/staff";
import { roleName } from "../../access";
import type { Department, Discipline, Role } from "../../types";


interface StaffFormProps {
  roles: Role[];
  departments: Department[];
  disciplines: Discipline[];
  onSubmit: (input: CreateStaffInput) => void;
  onCancel?: () => void; // shows a Cancel button that closes the form
}

const toId = (value: string) => (value === "" ? null : Number(value));


// Adds a person without an account (instructors and administrators).
// Students are added with New student, which also creates their login.
export function StaffForm({
  roles,
  departments,
  disciplines,
  onSubmit,
  onCancel,
}: StaffFormProps) {
  const staffRoles = roles.filter((r) => r.role_name !== "STUDENT");

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [disciplineId, setDisciplineId] = useState("");

  // Default to Instructor once the roles have loaded
  useEffect(() => {
    if (roleId === "" && staffRoles.length > 0) {
      const instructor = staffRoles.find((r) => r.role_name === "FACULTY_INSTRUCTOR") ?? staffRoles[0];
      setRoleId(String(instructor.role_id));
    }
  }, [roleId, staffRoles]);

  // Picking a discipline fills in its department when none is chosen yet
  const chooseDiscipline = (value: string) => {
    setDisciplineId(value);
    const discipline = disciplines.find((d) => d.discipline_id === Number(value));
    if (departmentId === "" && discipline?.department_id) {
      setDepartmentId(String(discipline.department_id));
    }
  };


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || roleId === "") {
      return;
    }

    onSubmit({
      first_name: firstName.trim(),
      middle_name: middleName.trim() || null,
      last_name: lastName.trim(),
      role_id: Number(roleId),
      department_id: toId(departmentId),
      discipline_id: toId(disciplineId),
    });

    setFirstName("");
    setMiddleName("");
    setLastName("");
    setDepartmentId("");
    setDisciplineId("");
  };


  return (
    <form onSubmit={handleSubmit} className="ui-panel" aria-label="New staff member">
      <header className="ui-panel-header">
        <div className="ui-panel-heading">
          <h2 className="ui-panel-title">New staff member</h2>
          <p className="ui-panel-description">
            For instructors and administrators. Students are added with New student.
          </p>
        </div>
      </header>

      <div className="ui-panel-body">
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="staff-first-name">
              First name<span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="staff-first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="ui-input"
              maxLength={100}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="staff-middle-name">Middle name</label>
            <input
              id="staff-middle-name"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className="ui-input"
              maxLength={100}
            />
          </div>

          <div className="form-field">
            <label htmlFor="staff-last-name">
              Last name<span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="staff-last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="ui-input"
              maxLength={100}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="staff-role">
              Role<span className="required" aria-hidden="true">*</span>
            </label>
            <select
              id="staff-role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="ui-input"
              required
            >
              {staffRoles.length === 0 && <option value="">Loading roles…</option>}
              {staffRoles.map((r) => (
                <option key={r.role_id} value={r.role_id}>{roleName(r.role_name)}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="staff-discipline">Discipline</label>
            <select
              id="staff-discipline"
              value={disciplineId}
              onChange={(e) => chooseDiscipline(e.target.value)}
              className="ui-input"
            >
              <option value="">None</option>
              {disciplines.map((d) => (
                <option key={d.discipline_id} value={d.discipline_id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="staff-department">Department</label>
            <select
              id="staff-department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="ui-input"
            >
              <option value="">None (administrators oversee all)</option>
              {departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="ui-panel-footer">
        {onCancel && (
          <button type="button" className="ui-button ui-button--secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="ui-button" disabled={roleId === ""}>
          Add staff member
        </button>
      </div>
    </form>
  );
}
