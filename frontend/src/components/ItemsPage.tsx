import { ItemForm } from "./Items/ItemForm";
import { ItemList } from "./Items/ItemList";
import { useItems } from "../hooks/useItems";

export function ItemsPage() {
  const { items, loading, error, create, remove } = useItems();

  return (
    <div>
      <h1>Items</h1>

      <ItemForm onSubmit={create} />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? <p>Loading...</p> : <ItemList items={items} onDelete={remove} />}
    </div>
  );
}
