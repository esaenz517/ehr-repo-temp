import type { Drug } from "../../types";

interface DrugListProps {
  drugs: Drug[];
  onDelete: (drugId: number) => void;
}

export function DrugList({ drugs, onDelete }: DrugListProps) {
  if (drugs.length === 0) {
    return <p className="ui-row-empty">No drugs yet.</p>;
  }

  return (
    <ul className="ui-row-list">
      {drugs.map((drug) => (
        <li key={drug.drug_id} className="ui-row">
          <div className="ui-row-main">
            <div className="ui-row-title">{drug.name}</div>
            {drug.description && <div className="ui-row-subtitle">{drug.description}</div>}
          </div>
          <div className="ui-row-actions">
            <button className="ui-button ui-button--danger" onClick={() => onDelete(drug.drug_id)}>
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
