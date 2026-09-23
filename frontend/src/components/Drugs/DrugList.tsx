import type { Drug } from "../../types";

interface DrugListProps {
  drugs: Drug[];
  onDelete: (drugId: number) => void;
}

export function DrugList({ drugs, onDelete }: DrugListProps) {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {drugs.map((drug) => (
        <li
          key={drug.drug_id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <div>
            <strong>{drug.name}</strong>
            {drug.description && (
              <div style={{ fontSize: 14, color: "#555" }}>{drug.description}</div>
            )}
          </div>
          <button onClick={() => onDelete(drug.drug_id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
