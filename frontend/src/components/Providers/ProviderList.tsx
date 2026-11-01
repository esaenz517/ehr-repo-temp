import { KeyboardEvent, useState } from "react";
import type { UpdateProviderInput } from "../../api/providers";
import type { Provider } from "../../types";
import "./providers.css";

interface ProviderListProps {
  providers: Provider[];
  emptyText: string; // shown when there are no rows (none yet, or none match the filters)
  onUpdate: (providerId: number, changes: UpdateProviderInput) => Promise<boolean>;
  onDelete: (providerId: number) => void;
}

// The editable fields. The Name column holds both name inputs; the rest get a column each.
type Draft = { firstName: string; lastName: string; specialty: string; phone: string; email: string };
type FieldKey = keyof Draft;
const FIELDS: Record<FieldKey, { label: string; maxLength: number }> = {
  firstName: { label: "First Name", maxLength: 100 },
  lastName: { label: "Last Name", maxLength: 100 },
  specialty: { label: "Specialty", maxLength: 100 },
  phone: { label: "Phone", maxLength: 20 },
  email: { label: "Email", maxLength: 200 },
};
const DETAIL_COLUMNS: { key: Exclude<FieldKey, "firstName" | "lastName">; label: string }[] = [
  { key: "specialty", label: "Specialty" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
];

// Displays every provider as a table row: name, specialty, phone, email. Edit
// turns the row's cells into inputs with Save and Cancel (Enter saves, Escape cancels).
export function ProviderList({ providers, emptyText, onUpdate, onDelete }: ProviderListProps) {
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
    return <p className="ui-row-empty">{emptyText}</p>;
  }

  // One draft input; the label names the provider so screen readers know which row it's in.
  const input = (key: FieldKey, provider: Provider, autoFocus = false) => (
    <input
      value={draft[key]}
      onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
      onKeyDown={(e) => handleKeyDown(e, provider.provider_id)}
      aria-label={`${FIELDS[key].label} for ${provider.first_name} ${provider.last_name}`}
      placeholder={FIELDS[key].label}
      maxLength={FIELDS[key].maxLength}
      autoFocus={autoFocus}
      className="ui-input ui-input--full"
    />
  );

  return (
    <div className="ui-table-card ui-table-wrap">
      <table className="ui-table providers-table">
        <thead>
          <tr>
            <th>Name</th>
            {DETAIL_COLUMNS.map((c) => <th key={c.key}>{c.label}</th>)}
            <th><span className="ui-visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {providers.map((provider) => {
            const editing = editingId === provider.provider_id;
            const values = { specialty: provider.specialty, phone: provider.phone, email: provider.email };

            return (
              <tr key={provider.provider_id}>
                <td className="providers-name">
                  {editing ? (
                    <div className="providers-name-inputs">
                      {input("firstName", provider, true)}
                      {input("lastName", provider)}
                    </div>
                  ) : (
                    <>Dr. {provider.first_name} {provider.last_name}</>
                  )}
                </td>
                {DETAIL_COLUMNS.map((c) => (
                  <td key={c.key} className={`providers-${c.key}`} data-label={c.label}>
                    {editing ? input(c.key, provider) : values[c.key] || <span className="ui-muted">—</span>}
                  </td>
                ))}
                <td className="providers-actions">
                  <div className="ui-row-actions">
                    {editing ? (
                      <>
                        <button
                          className="ui-button ui-button--small"
                          onClick={() => saveEdit(provider.provider_id)}
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
                          onClick={() => startEdit(provider)}
                        >
                          Edit
                        </button>
                        <button
                          className="ui-button ui-button--danger ui-button--small"
                          onClick={() => onDelete(provider.provider_id)}
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
