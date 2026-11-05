import { KeyboardEvent, useState } from "react";
import type { UpdateStaffInput } from "../../api/staff";
import type { Staff } from "../../types";
import { confirmDelete } from "../confirmDelete";
import "./staff.css";

interface StaffListProps {
  staff: Staff[];
  emptyText: string; // shown when there are no rows (none yet, or none match the filters)
  onUpdate: (staffId: number, changes: UpdateStaffInput) => Promise<boolean>;
  onDelete: (staffId: number) => void;
}

// The editable text fields. The Name column holds the three name inputs.
type Draft = { firstName: string; middleName: string; lastName: string; specialization: string; admin: boolean };
type TextField = Exclude<keyof Draft, "admin">;
const FIELD_LABELS: Record<TextField, string> = {
  firstName: "First Name",
  middleName: "Middle Name",
  lastName: "Last Name",
  specialization: "Specialization",
};
const NAME_FIELDS: TextField[] = ["firstName", "middleName", "lastName"];

// Displays every staff member as a table row: name, specialization, role. Edit
// turns the row's cells into the same fields as the Add Staff form, with Save
// and Cancel (Enter saves, Escape cancels).
// The student flag isn't editable; students are managed through the student workflow.
export function StaffList({ staff, emptyText, onUpdate, onDelete }: StaffListProps) {
  // Only one staff member is edited at a time: their id and the draft values.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>({
    firstName: "", middleName: "", lastName: "", specialization: "", admin: false,
  });

  const startEdit = (member: Staff) => {
    setEditingId(member.staffid);
    setDraft({
      firstName: member.first_name,
      middleName: member.middle_name ?? "",
      lastName: member.last_name,
      specialization: member.specialization,
      admin: member.admin,
    });
  };

  const canSave = draft.firstName.trim() !== "" && draft.lastName.trim() !== "" && draft.specialization.trim() !== "";

  const saveEdit = async (staffId: number) => {
    if (!canSave) return;
    const saved = await onUpdate(staffId, {
      first_name: draft.firstName.trim(),
      middle_name: draft.middleName.trim() || null,
      last_name: draft.lastName.trim(),
      specialization: draft.specialization.trim(),
      admin: draft.admin,
    });
    if (saved) setEditingId(null);
  };

  const handleKeyDown = (e: KeyboardEvent, staffId: number) => {
    if (e.key === "Enter") saveEdit(staffId);
    if (e.key === "Escape") setEditingId(null);
  };

  if (staff.length === 0) {
    return <p className="ui-row-empty">{emptyText}</p>;
  }

  // One draft input; the label names the person so screen readers know which row it's in.
  const input = (key: TextField, member: Staff, autoFocus = false) => (
    <input
      value={draft[key]}
      onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
      onKeyDown={(e) => handleKeyDown(e, member.staffid)}
      aria-label={`${FIELD_LABELS[key]} for ${member.first_name} ${member.last_name}`}
      placeholder={FIELD_LABELS[key]}
      maxLength={100}
      autoFocus={autoFocus}
      className="ui-input ui-input--full"
    />
  );

  return (
    <div className="ui-table-card ui-table-wrap">
      <table className="ui-table staff-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Specialization</th>
            <th>Role</th>
            <th><span className="ui-visually-hidden">Actions</span></th>
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
                      {NAME_FIELDS.map((key, i) => <span key={key}>{input(key, member, i === 0)}</span>)}
                    </div>
                  ) : (
                    [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(" ")
                  )}
                </td>
                <td className="staff-specialization" data-label="Specialization">
                  {editing ? input("specialization", member) : member.specialization}
                </td>
                <td className="staff-role" data-label="Role">
                  <div className="staff-role-tags">
                    {/* The student flag isn't editable here, so it shows as a tag either way */}
                    {member.student && <span className="ui-badge">Student</span>}
                    {editing ? (
                      <select
                        value={draft.admin ? "yes" : "no"}
                        onChange={(e) => setDraft((prev) => ({ ...prev, admin: e.target.value === "yes" }))}
                        onKeyDown={(e) => e.key === "Escape" && setEditingId(null)}
                        aria-label={`Admin for ${member.first_name} ${member.last_name}`}
                        className="ui-input"
                      >
                        <option value="no">Admin: No</option>
                        <option value="yes">Admin: Yes</option>
                      </select>
                    ) : (
                      <>
                        {member.admin && <span className="ui-badge ui-badge--solid">Admin</span>}
                        {!member.admin && !member.student && <span className="ui-badge ui-badge--muted">Staff</span>}
                      </>
                    )}
                  </div>
                </td>
                <td className="staff-actions">
                  <div className="ui-row-actions">
                    {editing ? (
                      <>
                        <button
                          className="ui-button ui-button--small"
                          onClick={() => saveEdit(member.staffid)}
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
                        <button
                          className="ui-button ui-button--secondary ui-button--small"
                          onClick={() => startEdit(member)}
                        >
                          Edit
                        </button>
                        <button
                          className="ui-button ui-button--danger ui-button--small"
                          onClick={() => {
                            if (
                              confirmDelete(
                                `staff member ${member.first_name} ${member.last_name}`,
                                `/staff/${member.staffid}`
                              )
                            ) {
                              onDelete(member.staffid);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
