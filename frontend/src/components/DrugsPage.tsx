import { DrugForm } from "./Drugs/DrugForm";
import { DrugList } from "./Drugs/DrugList";
import { useDrugs } from "../hooks/useDrugs";

export function DrugsPage() {
  const { drugs, loading, error, create, remove } = useDrugs();

  return (
    <div>
      <h1>Drugs</h1>

      <DrugForm onSubmit={create} />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? <p>Loading...</p> : <DrugList drugs={drugs} onDelete={remove} />}
    </div>
  );
}
