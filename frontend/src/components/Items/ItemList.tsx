import type { Item } from "../../types";

interface ItemListProps {
  items: Item[];
  onDelete: (id: number) => void;
}

export function ItemList({ items, onDelete }: ItemListProps) {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {items.map((item) => (
        <li
          key={item.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <div>
            <strong>{item.name}</strong>
            {item.description && (
              <div style={{ fontSize: 14, color: "#555" }}>{item.description}</div>
            )}
          </div>
          <button onClick={() => onDelete(item.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
