import { useState } from "react";
import { DrugForm } from "./Drugs/DrugForm";
import { DrugList } from "./Drugs/DrugList";
import { useDrugs } from "../hooks/useDrugs";

// Create, list, filter, edit, and delete drugs.
export function DrugsPage() {
  const { drugs, loading, error, create, update, remove } = useDrugs();
  const [search, setSearch] = useState(""); // matches the name or description

  const query = search.trim().toLowerCase();
  const shown = drugs.filter(
    (d) => !query || d.name.toLowerCase().includes(query) || (d.description ?? "").toLowerCase().includes(query)
  );

  return (
    <div className="ui-page">
      <h1 className="ui-page-title">Drugs</h1>

      <DrugForm onSubmit={create} />

      <div className="ui-filter-bar" role="search" aria-label="Filter drugs">
        <label className={`ui-filter-field${query ? " ui-filter-field--active" : ""}`}>
          <span className="ui-filter-label">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or description"
            className="ui-input"
          />
        </label>

        {query && (
          <button type="button" className="ui-button ui-button--secondary ui-filter-clear" onClick={() => setSearch("")}>
            Clear search
          </button>
        )}

        <div className="ui-filter-summary">
          {!loading && (
            <span aria-live="polite">
              Showing <strong>{shown.length}</strong> of {drugs.length} drug{drugs.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      {error && <p className="ui-error">{error}</p>}
      {loading ? (
        <p className="ui-muted">Loading...</p>
      ) : (
        <DrugList
          drugs={shown}
          emptyText={drugs.length > 0 ? "No drugs match your search." : "No drugs yet."}
          onUpdate={update}
          onDelete={remove}
        />
      )}
    </div>
  );
}
