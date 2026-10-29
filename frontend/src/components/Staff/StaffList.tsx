import { KeyboardEvent, useState } from "react";
import type { UpdateStaffInput } from "../../api/staff";
import type { Staff } from "../../types";

interface StaffListProps {
  staff: Staff[];
  onUpdate: (staffId: number, changes: UpdateStaffInput) => Promise<boolean>;
  onDelete: (staffId: number) => void;
}

// The editable text fields, in the order the inputs are shown.
type Draft = { firstName: string; middleName: string; lastName: string; specialization: string; admin: boolean };
const TEXT_FIELDS: { key: Exclude<keyof Draft, "admin">; label: string }[] = [
  { key: "firstName", label: "First Name" },
  { key: "middleName", label: "Middle Name" },
  { key: "lastName", label: "Last Name" },
  { key: "specialization", label: "Specialization" },
];

// Displays every staff member as a row. Edit turns the row into the same fields
// as the Add Staff form, with Save and Cancel (Enter saves, Escape cancels).
// The student flag isn't editable; students are managed through the student workflow.
export function StaffList({ staff, onUpdate, onDelete }: StaffListProps) {
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
    return <p className="ui-row-empty">No staff yet.</p>;
  }

  return (
    <ul className="ui-row-list">
      {staff.map((member) => {
        const editing = editingId === member.staffid;
        return (
          <li key={member.staffid} className="ui-row">
            {editing ? (
              <div className="ui-row-main ui-form-row">
                {TEXT_FIELDS.map((field, i) => (
                  <input
                    key={field.key}
                    value={draft[field.key]}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    onKeyDown={(e) => handleKeyDown(e, member.staffid)}
                    aria-label={field.label}
                    placeholder={field.label}
                    maxLength={100}
                    autoFocus={i === 0}
                    className="ui-input"
                  />
                ))}
                <select
                  value={draft.admin ? "yes" : "no"}
                  onChange={(e) => setDraft((prev) => ({ ...prev, admin: e.target.value === "yes" }))}
                  onKeyDown={(e) => e.key === "Escape" && setEditingId(null)}
                  aria-label="Admin"
                  className="ui-input"
                >
                  <option value="no">Admin: No</option>
                  <option value="yes">Admin: Yes</option>
                </select>
              </div>
            ) : (
              <div className="ui-row-main">
                <div className="ui-row-title">
                  {member.first_name} {member.middle_name ? `${member.middle_name} ` : ""}
                  {member.last_name}
                </div>
                <div className="ui-row-subtitle">
                  {member.specialization}
                  {member.student && <> · Student</>}
                  {member.admin && <> · Admin</>}
                </div>
              </div>
            )}
            <div className="ui-row-actions">
              {editing ? (
                <>
                  <button className="ui-button" onClick={() => saveEdit(member.staffid)} disabled={!canSave}>
                    Save
                  </button>
                  <button className="ui-button ui-button--secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="ui-button ui-button--secondary" onClick={() => startEdit(member)}>
                    Edit
                  </button>
                  <button className="ui-button ui-button--danger" onClick={() => onDelete(member.staffid)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
