import { ItemForm } from "./components/ItemForm";
import { ItemList } from "./components/ItemList";
import { useItems } from "./hooks/useItems";

function App() {
  const { items, loading, error, create, remove } = useItems();

  return (
    <div style={{ maxWidth: 560, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Items</h1>

      <ItemForm onSubmit={create} />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? <p>Loading...</p> : <ItemList items={items} onDelete={remove} />}
    </div>
  );
}

export default App;
