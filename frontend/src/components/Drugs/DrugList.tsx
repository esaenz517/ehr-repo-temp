import { useState } from "react";
import type { UpdateDrugInput } from "../../api/drugs";
import type { Drug } from "../../types";

interface DrugListProps {
  drugs: Drug[];
  onUpdate: (drugId: number, changes: UpdateDrugInput) => Promise<boolean>;
  onDelete: (drugId: number) => void;
}

// Displays every drug as a row. Edit turns the row into name/description
// inputs with Save and Cancel (Enter saves, Escape cancels).
export function DrugList({ drugs, onUpdate, onDelete }: DrugListProps) {
  // Only one drug is edited at a time: its id and the draft values.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  const startEdit = (drug: Drug) => {
    setEditingId(drug.drug_id);
    setDraftName(drug.name);
    setDraftDescription(drug.description ?? "");
  };

  const saveEdit = async (drugId: number) => {
    if (!draftName.trim()) return;
    const saved = await onUpdate(drugId, {
      name: draftName.trim(),
      description: draftDescription.trim() || null,
    });
    if (saved) setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, drugId: number) => {
    if (e.key === "Enter") saveEdit(drugId);
    if (e.key === "Escape") setEditingId(null);
  };

  if (drugs.length === 0) {
    return <p className="ui-row-empty">No drugs yet.</p>;
  }

  return (
    <ul className="ui-row-list">
      {drugs.map((drug) => {
        const editing = editingId === drug.drug_id;
        return (
          <li key={drug.drug_id} className="ui-row">
            {editing ? (
              <div className="ui-row-main ui-form-row">
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, drug.drug_id)}
                  aria-label={`Name for ${drug.name}`}
                  placeholder="Name"
                  maxLength={200}
                  autoFocus
                  className="ui-input"
                />
                <input
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, drug.drug_id)}
                  aria-label={`Description for ${drug.name}`}
                  placeholder="Description (optional)"
                  maxLength={1000}
                  className="ui-input ui-input--wide"
                />
              </div>
            ) : (
              <div className="ui-row-main">
                <div className="ui-row-title">{drug.name}</div>
                {drug.description && <div className="ui-row-subtitle">{drug.description}</div>}
              </div>
            )}
            <div className="ui-row-actions">
              {editing ? (
                <>
                  <button
                    className="ui-button"
                    onClick={() => saveEdit(drug.drug_id)}
                    disabled={!draftName.trim()}
                  >
                    Save
                  </button>
                  <button className="ui-button ui-button--secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="ui-button ui-button--secondary" onClick={() => startEdit(drug)}>
                    Edit
                  </button>
                  <button className="ui-button ui-button--danger" onClick={() => onDelete(drug.drug_id)}>
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
