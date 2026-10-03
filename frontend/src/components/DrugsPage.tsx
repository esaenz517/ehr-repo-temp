import { DrugForm } from "./Drugs/DrugForm";
import { DrugList } from "./Drugs/DrugList";
import { useDrugs } from "../hooks/useDrugs";

export function DrugsPage() {
  const { drugs, loading, error, create, remove } = useDrugs();

  return (
    <div className="ui-page">
      <h1 className="ui-page-title">Drugs</h1>

      <DrugForm onSubmit={create} />

      {error && <p className="ui-error">{error}</p>}
      {loading ? <p className="ui-muted">Loading...</p> : <DrugList drugs={drugs} onDelete={remove} />}
    </div>
  );
}
