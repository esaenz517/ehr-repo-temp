import { KeyboardEvent, useState } from "react";
import type { UpdateStaffInput } from "../../api/staff";
import { roleName } from "../../access";
import type { Department, Discipline, Role, Staff } from "../../types";
import { confirmDelete } from "../confirmDelete";
import "./staff.css";

interface StaffListProps {
  staff: Staff[];
  emptyText: string; // shown when there are no rows (none yet, or none match the filters)
  roles: Role[];
  departments: Department[];
  disciplines: Discipline[];
  canEdit: boolean;
  canDelete: boolean;
  canChangeRole: boolean;
  onUpdate: (staffId: number, changes: UpdateStaffInput) => Promise<boolean>;
  onSetRole: (staffId: number, roleId: number) => Promise<boolean>;
  onDelete: (staffId: number) => void;
}

// The editable fields. The Name column holds the three name inputs; ids are
// kept as strings for the selects ("" = none).
type Draft = {
  firstName: string;
  middleName: string;
  lastName: string;
  roleId: string;
  departmentId: string;
  disciplineId: string;
};
type NameField = "firstName" | "middleName" | "lastName";
const NAME_LABELS: Record<NameField, string> = {
  firstName: "First Name",
  middleName: "Middle Name",
  lastName: "Last Name",
};
const NAME_FIELDS: NameField[] = ["firstName", "middleName", "lastName"];

const toId = (value: string) => (value === "" ? null : Number(value));

const ROLE_BADGES: Record<string, string> = {
  ADMIN: "ui-badge ui-badge--solid",
  FACULTY_INSTRUCTOR: "ui-badge ui-badge--muted",
  STUDENT: "ui-badge",
};

// Displays every person as a table row: name, role, department, discipline.
// Edit turns the row's cells into fields, with Save and Cancel (Enter saves,
// Escape cancels). The role select only shows for people allowed to change roles.
export function StaffList({
  staff,
  emptyText,
  roles,
  departments,
  disciplines,
  canEdit,
  canDelete,
  canChangeRole,
  onUpdate,
  onSetRole,
  onDelete,
}: StaffListProps) {
  // Only one person is edited at a time: their id and the draft values.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>({
    firstName: "", middleName: "", lastName: "", roleId: "", departmentId: "", disciplineId: "",
  });

  const startEdit = (member: Staff) => {
    setEditingId(member.staffid);
    setDraft({
      firstName: member.first_name,
      middleName: member.middle_name ?? "",
      lastName: member.last_name,
      roleId: String(member.role_id),
      departmentId: member.department_id === null ? "" : String(member.department_id),
      disciplineId: member.discipline_id === null ? "" : String(member.discipline_id),
    });
  };

  const canSave = draft.firstName.trim() !== "" && draft.lastName.trim() !== "";

  const saveEdit = async (member: Staff) => {
    if (!canSave) return;
    let saved = await onUpdate(member.staffid, {
      first_name: draft.firstName.trim(),
      middle_name: draft.middleName.trim() || null,
      last_name: draft.lastName.trim(),
      department_id: toId(draft.departmentId),
      discipline_id: toId(draft.disciplineId),
    });
    if (saved && canChangeRole && Number(draft.roleId) !== member.role_id) {
      saved = await onSetRole(member.staffid, Number(draft.roleId));
    }
    if (saved) setEditingId(null);
  };

  const handleKeyDown = (e: KeyboardEvent, member: Staff) => {
    if (e.key === "Enter") saveEdit(member);
    if (e.key === "Escape") setEditingId(null);
  };

  if (staff.length === 0) {
    return <p className="ui-row-empty">{emptyText}</p>;
  }

  const who = (member: Staff) => `${member.first_name} ${member.last_name}`;

  // One name input; the label names the person so screen readers know which row it's in.
  const nameInput = (key: NameField, member: Staff, autoFocus = false) => (
    <input
      value={draft[key]}
      onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
      onKeyDown={(e) => handleKeyDown(e, member)}
      aria-label={`${NAME_LABELS[key]} for ${who(member)}`}
      placeholder={NAME_LABELS[key]}
      maxLength={100}
      autoFocus={autoFocus}
      className="ui-input ui-input--full"
    />
  );

  // A select for one of the id fields
  const select = (
    key: "roleId" | "departmentId" | "disciplineId",
    label: string,
    member: Staff,
    options: { value: number; label: string }[],
    noneLabel?: string,
  ) => (
    <select
      value={draft[key]}
      onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
      onKeyDown={(e) => e.key === "Escape" && setEditingId(null)}
      aria-label={`${label} for ${who(member)}`}
      className="ui-input"
    >
      {noneLabel !== undefined && <option value="">{noneLabel}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );

  const showActions = canEdit || canDelete;

  return (
    <div className="ui-table-card ui-table-wrap">
      <table className="ui-table staff-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Department</th>
            <th>Discipline</th>
            {showActions && <th><span className="ui-visually-hidden">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {staff.map((member) => {
            const editing = editingId === member.staffid;
            return (
              <tr key={member.staffid}>
                <td className="staff-name">
                  {editing ? (
                    <div className="staff-name-inputs">
                      {NAME_FIELDS.map((key, i) => <span key={key}>{nameInput(key, member, i === 0)}</span>)}
                    </div>
                  ) : (
                    <>
                      {[member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" ")}
                      {member.user_id === null && (
                        <span className="staff-no-login" title="This person has no account and can't sign in">
                          No login
                        </span>
                      )}
                    </>
                  )}
                </td>
                <td className="staff-role" data-label="Role">
                  {editing && canChangeRole ? (
                    select("roleId", "Role", member, roles.map((r) => ({ value: r.role_id, label: roleName(r.role_name) })))
                  ) : (
                    <span className={ROLE_BADGES[member.role_name ?? ""] ?? "ui-badge ui-badge--muted"}>
                      {roleName(member.role_name)}
                    </span>
                  )}
                </td>
                <td className="staff-department" data-label="Department">
                  {editing
                    ? select("departmentId", "Department", member,
                        departments.map((d) => ({ value: d.department_id, label: d.name })), "None")
                    : member.department_name ?? <span className="ui-muted">{member.admin ? "All" : "—"}</span>}
                </td>
                <td className="staff-discipline" data-label="Discipline">
                  {editing
                    ? select("disciplineId", "Discipline", member,
                        disciplines.map((d) => ({ value: d.discipline_id, label: d.name })), "None")
                    : member.discipline_name ?? <span className="ui-muted">—</span>}
                </td>
                {showActions && (
                  <td className="staff-actions">
                    <div className="ui-row-actions">
                      {editing ? (
                        <>
                          <button
                            className="ui-button ui-button--small"
                            onClick={() => saveEdit(member)}
                            disabled={!canSave}
                          >
                            Save
                          </button>
                          <button
                            className="ui-button ui-button--secondary ui-button--small"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {canEdit && (
                            <button
                              className="ui-button ui-button--secondary ui-button--small"
                              onClick={() => startEdit(member)}
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="ui-button ui-button--danger ui-button--small"
                              onClick={() => {
                                if (confirmDelete(`staff member ${who(member)}`, `/staff/${member.staffid}`)) {
                                  onDelete(member.staffid);
                                }
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
