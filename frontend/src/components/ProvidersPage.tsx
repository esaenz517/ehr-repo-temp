import { useState } from "react";
import { PageHeader } from "./PageHeader";
import { Panel } from "./Panel";
import { ProviderForm } from "./Providers/ProviderForm";
import { ProviderList } from "./Providers/ProviderList";
import { useProviders } from "../hooks/useProviders";

// Create, list, filter, edit, and delete providers.
export function ProvidersPage() {
  const { providers, loading, error, create, update, remove } = useProviders();
  const [search, setSearch] = useState(""); // matches the name, phone, or email
  const [specialty, setSpecialty] = useState("all"); // "all" or one provider's specialty
  const [adding, setAdding] = useState(false); // the New provider form is open

  // Every specialty some provider has, A to Z
  const specialtyOptions = [...new Set(providers.map((p) => p.specialty).filter((s): s is string => Boolean(s)))].sort();

  const query = search.trim().toLowerCase();
  const shown = providers.filter(
    (p) =>
      (!query ||
        [`${p.first_name} ${p.last_name}`, p.phone, p.email].some((v) => (v ?? "").toLowerCase().includes(query))) &&
      (specialty === "all" || p.specialty === specialty)
  );

  const filtering = query !== "" || specialty !== "all";
  const clearFilters = () => {
    setSearch("");
    setSpecialty("all");
  };

  return (
    <div className="ui-page">
      <PageHeader
        title="Providers"
        description="Clinicians patients can be assigned to and booked with."
        actions={
          <button className="ui-button" aria-expanded={adding} onClick={() => setAdding((open) => !open)}>
            {adding ? "Close form" : "New provider"}
          </button>
        }
      />

      {adding && <ProviderForm onSubmit={create} onCancel={() => setAdding(false)} />}

      {error && <p className="ui-error">{error}</p>}

      <Panel
        flush
        toolbar={
          <div className="ui-filter-bar" role="search" aria-label="Filter providers">
            <label className={`ui-filter-field${query ? " ui-filter-field--active" : ""}`}>
              <span className="ui-filter-label">Search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, phone, or email"
                className="ui-input"
              />
            </label>

            <label className={`ui-filter-field${specialty !== "all" ? " ui-filter-field--active" : ""}`}>
              <span className="ui-filter-label">Specialty</span>
              <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="ui-input">
                <option value="all">All specialties</option>
                {specialtyOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            {filtering && (
              <button type="button" className="ui-button ui-button--secondary ui-filter-clear" onClick={clearFilters}>
                Clear filters
              </button>
            )}

            <div className="ui-filter-summary">
              {!loading && (
                <span aria-live="polite">
                  Showing <strong>{shown.length}</strong> of {providers.length} provider{providers.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        }
      >
        {loading ? (
          <p className="ui-row-empty">Loading providers…</p>
        ) : (
          <ProviderList
            providers={shown}
            emptyText={providers.length > 0 ? "No providers match these filters." : "No providers yet."}
            onUpdate={update}
            onDelete={remove}
          />
        )}
      </Panel>
    </div>
  );
}
