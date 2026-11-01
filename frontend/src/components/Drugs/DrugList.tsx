import { useState } from "react";
import type { UpdateDrugInput } from "../../api/drugs";
import type { Drug } from "../../types";
import "./drugs.css";

interface DrugListProps {
  drugs: Drug[];
  emptyText: string; // shown when there are no rows (none yet, or none match the filters)
  onUpdate: (drugId: number, changes: UpdateDrugInput) => Promise<boolean>;
  onDelete: (drugId: number) => void;
}

// Displays every drug as a table row: name and description. Edit turns the
// row's cells into inputs with Save and Cancel (Enter saves, Escape cancels).
export function DrugList({ drugs, emptyText, onUpdate, onDelete }: DrugListProps) {
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
    return <p className="ui-row-empty">{emptyText}</p>;
  }

  return (
    <div className="ui-table-card ui-table-wrap">
      <table className="ui-table drugs-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th><span className="ui-visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {drugs.map((drug) => {
            const editing = editingId === drug.drug_id;
            return (
              <tr key={drug.drug_id}>
                <td className="drugs-name">
                  {editing ? (
                    <input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, drug.drug_id)}
                      aria-label={`Name for ${drug.name}`}
                      placeholder="Name"
                      maxLength={200}
                      autoFocus
                      className="ui-input ui-input--full"
                    />
                  ) : (
                    drug.name
                  )}
                </td>
                <td className="drugs-description">
                  {editing ? (
                    <input
                      value={draftDescription}
                      onChange={(e) => setDraftDescription(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, drug.drug_id)}
                      aria-label={`Description for ${drug.name}`}
                      placeholder="Description (optional)"
                      maxLength={1000}
                      className="ui-input ui-input--full"
                    />
                  ) : (
                    drug.description || <span className="ui-muted">—</span>
                  )}
                </td>
                <td className="drugs-actions">
                  <div className="ui-row-actions">
                    {editing ? (
                      <>
                        <button
                          className="ui-button ui-button--small"
                          onClick={() => saveEdit(drug.drug_id)}
                          disabled={!draftName.trim()}
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
                          onClick={() => startEdit(drug)}
                        >
                          Edit
                        </button>
                        <button
                          className="ui-button ui-button--danger ui-button--small"
                          onClick={() => onDelete(drug.drug_id)}
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
