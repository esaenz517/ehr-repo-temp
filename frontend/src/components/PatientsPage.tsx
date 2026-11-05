import { useState } from "react";
import { PatientForm } from "./Patients/PatientForm";
import { PatientList } from "./Patients/PatientList";
import { usePatients } from "../hooks/usePatients";
import { PageHeader } from "./PageHeader";
import { Panel } from "./Panel";
import { useProviders } from "../hooks/useProviders";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "outpatient", label: "Outpatient" },
  { value: "inpatient", label: "Inpatient" },
];

// Create, list, filter, edit, and delete patients.
export function PatientsPage() {
  const { patients, loading, error, create, update, remove } = usePatients();
  const { providers } = useProviders();
  const [search, setSearch] = useState(""); // matches the name, preferred name, or MRN
  const [dob, setDob] = useState(""); // "" or a "YYYY-MM-DD" date of birth
  const [status, setStatus] = useState("all"); // "all", "outpatient", or "inpatient"
  const [provider, setProvider] = useState("all"); // "all", "none", or a provider id
  const [adding, setAdding] = useState(false); // the New patient form is open

  const query = search.trim().toLowerCase();
  const shown = patients.filter(
    (p) =>
      (!query ||
        [[p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" "), p.preferred_name, p.mrn].some((v) =>
          (v ?? "").toLowerCase().includes(query)
        )) &&
      (!dob || p.date_of_birth === dob) &&
      (status === "all" || p.status === status) &&
      (provider === "all" || (provider === "none" ? p.provider_id === null : p.provider_id === Number(provider)))
  );

  const filtering = query !== "" || dob !== "" || status !== "all" || provider !== "all";
  const clearFilters = () => {
    setSearch("");
    setDob("");
    setStatus("all");
    setProvider("all");
  };

  return (
    <div className="ui-page">
      <PageHeader
        title="Patients"
        description="Register patients and open their history, appointments, charges and insurance."
        actions={
          <button className="ui-button" aria-expanded={adding} onClick={() => setAdding((open) => !open)}>
            {adding ? "Close form" : "New patient"}
          </button>
        }
      />

      {adding && <PatientForm providers={providers} onSubmit={create} onCancel={() => setAdding(false)} />}

      {error && <p className="ui-error">{error}</p>}

      <Panel
        flush
        toolbar={
          <div className="ui-filter-bar" role="search" aria-label="Filter patients">
            <label className={`ui-filter-field${query ? " ui-filter-field--active" : ""}`}>
              <span className="ui-filter-label">Search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or MRN"
                className="ui-input"
              />
            </label>

            <label className={`ui-filter-field${dob ? " ui-filter-field--active" : ""}`}>
              <span className="ui-filter-label">Date of birth</span>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="ui-input" />
            </label>

            <label className={`ui-filter-field${status !== "all" ? " ui-filter-field--active" : ""}`}>
              <span className="ui-filter-label">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="ui-input">
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </label>

            <label className={`ui-filter-field${provider !== "all" ? " ui-filter-field--active" : ""}`}>
              <span className="ui-filter-label">Provider</span>
              <select value={provider} onChange={(e) => setProvider(e.target.value)} className="ui-input">
                <option value="all">All providers</option>
                {providers.map((p) => (
                  <option key={p.provider_id} value={p.provider_id}>{p.first_name} {p.last_name}</option>
                ))}
                <option value="none">No provider</option>
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
                  Showing <strong>{shown.length}</strong> of {patients.length} patient{patients.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        }
      >
        {loading ? (
          <p className="ui-row-empty">Loading patients…</p>
        ) : (
          <PatientList
            patients={shown}
            emptyText={patients.length > 0 ? "No patients match these filters." : "No patients yet."}
            providers={providers}
            onUpdate={update}
            onDelete={remove}
          />
        )}
      </Panel>
    </div>
  );
}
