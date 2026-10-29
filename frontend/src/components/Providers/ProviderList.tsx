import { KeyboardEvent, useState } from "react";
import type { UpdateProviderInput } from "../../api/providers";
import type { Provider } from "../../types";

interface ProviderListProps {
  providers: Provider[];
  onUpdate: (providerId: number, changes: UpdateProviderInput) => Promise<boolean>;
  onDelete: (providerId: number) => void;
}

// The editable fields, in the order the inputs are shown.
type Draft = { firstName: string; lastName: string; specialty: string; phone: string; email: string };
const FIELDS: { key: keyof Draft; label: string; maxLength: number }[] = [
  { key: "firstName", label: "First Name", maxLength: 100 },
  { key: "lastName", label: "Last Name", maxLength: 100 },
  { key: "specialty", label: "Specialty", maxLength: 100 },
  { key: "phone", label: "Phone", maxLength: 20 },
  { key: "email", label: "Email", maxLength: 200 },
];

// Displays every provider as a row. Edit turns the row into inputs with
// Save and Cancel (Enter saves, Escape cancels).
export function ProviderList({ providers, onUpdate, onDelete }: ProviderListProps) {
  // Only one provider is edited at a time: its id and the draft values.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>({ firstName: "", lastName: "", specialty: "", phone: "", email: "" });

  const startEdit = (provider: Provider) => {
    setEditingId(provider.provider_id);
    setDraft({
      firstName: provider.first_name,
      lastName: provider.last_name,
      specialty: provider.specialty ?? "",
      phone: provider.phone ?? "",
      email: provider.email ?? "",
    });
  };

  const canSave = draft.firstName.trim() !== "" && draft.lastName.trim() !== "";

  const saveEdit = async (providerId: number) => {
    if (!canSave) return;
    const saved = await onUpdate(providerId, {
      first_name: draft.firstName.trim(),
      last_name: draft.lastName.trim(),
      specialty: draft.specialty.trim() || null,
      phone: draft.phone.trim() || null,
      email: draft.email.trim() || null,
    });
    if (saved) setEditingId(null);
  };

  const handleKeyDown = (e: KeyboardEvent, providerId: number) => {
    if (e.key === "Enter") saveEdit(providerId);
    if (e.key === "Escape") setEditingId(null);
  };

  if (providers.length === 0) {
    return <p className="ui-row-empty">No providers yet.</p>;
  }

  return (
    <ul className="ui-row-list">
      {providers.map((provider) => {
        const editing = editingId === provider.provider_id;
        // Only join the contact fields that are filled in, so there's no stray " · "
        const details = [provider.specialty, provider.phone, provider.email].filter(Boolean).join(" · ");

        return (
          <li key={provider.provider_id} className="ui-row">
            {editing ? (
              <div className="ui-row-main ui-form-row">
                {FIELDS.map((field, i) => (
                  <input
                    key={field.key}
                    value={draft[field.key]}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    onKeyDown={(e) => handleKeyDown(e, provider.provider_id)}
                    aria-label={field.label}
                    placeholder={field.label}
                    maxLength={field.maxLength}
                    autoFocus={i === 0}
                    className="ui-input"
                  />
                ))}
              </div>
            ) : (
              <div className="ui-row-main">
                <div className="ui-row-title">
                  Dr. {provider.first_name} {provider.last_name}
                </div>
                {details && <div className="ui-row-subtitle">{details}</div>}
              </div>
            )}
            <div className="ui-row-actions">
              {editing ? (
                <>
                  <button
                    className="ui-button"
                    onClick={() => saveEdit(provider.provider_id)}
                    disabled={!canSave}
                  >
                    Save
                  </button>
                  <button className="ui-button ui-button--secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="ui-button ui-button--secondary" onClick={() => startEdit(provider)}>
                    Edit
                  </button>
                  <button
                    className="ui-button ui-button--danger"
                    onClick={() => onDelete(provider.provider_id)}
                  >
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
