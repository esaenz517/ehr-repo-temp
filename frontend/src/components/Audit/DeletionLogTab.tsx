import { useEffect, useState } from "react";
import { formatUtc } from "../../api/clinicalNotes";
import { deletionAuditApi, type DeletionEntry, type DeletionOutcome } from "../../api/deletionAudit";
import { Panel } from "../Panel";
import "./audit.css";

const PAGE_SIZE = 50;

const OUTCOMES: { value: "" | DeletionOutcome; label: string }[] = [
  { value: "", label: "All outcomes" },
  { value: "deleted", label: "Deleted" },
  { value: "cancelled", label: "Cancelled" },
  { value: "denied", label: "Denied" },
  { value: "not_found", label: "Not found" },
  { value: "conflict", label: "Conflict" },
  { value: "rejected", label: "Rejected" },
  { value: "error", label: "Server error" },
];

const OUTCOME_BADGE: Record<DeletionOutcome, string> = {
  deleted: "ui-badge--signed",
  cancelled: "ui-badge--muted",
  denied: "ui-badge--error",
  error: "ui-badge--error",
  not_found: "ui-badge--muted",
  conflict: "ui-badge--muted",
  rejected: "ui-badge--muted",
};

const outcomeLabel = (value: string) => OUTCOMES.find((o) => o.value === value)?.label ?? value;

// "patients/medical-history" -> "Patients › Medical history"
const resourceLabel = (resource: string) =>
  resource
    .split("/")
    .map((part) => {
      const words = part.replace(/[-_]/g, " ");
      return words.charAt(0).toUpperCase() + words.slice(1);
    })
    .join(" › ");

// The Deletions tab of the Audit Log page (admin only): every delete request
// across the app, allowed or not, and every delete the user cancelled.
export function DeletionLogTab() {
  const [resource, setResource] = useState("");
  const [outcome, setOutcome] = useState("");
  const [recordId, setRecordId] = useState("");
  const [page, setPage] = useState(0);

  const [resources, setResources] = useState<string[]>([]);
  const [rows, setRows] = useState<DeletionEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The kinds of records in the log, for the filter
  useEffect(() => {
    deletionAuditApi
      .resources()
      .then(setResources)
      .catch(() => setResources([]));
  }, []);

  useEffect(() => {
    let live = true;
    setLoading(true);
    deletionAuditApi
      .list({
        resource: resource || undefined,
        resource_id: recordId.trim() || undefined,
        outcome: outcome || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      .then((result) => {
        if (!live) return;
        setRows(result.items);
        setTotal(result.total);
        setError(null);
      })
      .catch((e: Error) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [resource, outcome, recordId, page]);

  // Any filter change starts again at the first page
  const filter = (set: (value: string) => void) => (value: string) => {
    set(value);
    setPage(0);
  };

  const filtering = resource || outcome || recordId;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <>
      <p className="ui-muted audit-intro">
        Every delete request across the app, allowed or refused, and every delete that was cancelled at the
        confirmation prompt.
      </p>

      {error && <p className="ui-error">{error}</p>}

      <Panel
        flush
        toolbar={
          <div className="ui-filter-bar" role="search" aria-label="Filter the deletion log">
            <label className={`ui-filter-field${resource ? " ui-filter-field--active" : ""}`}>
              <span className="ui-filter-label">Record type</span>
              <select value={resource} onChange={(e) => filter(setResource)(e.target.value)} className="ui-input">
                <option value="">All records</option>
                {resources.map((r) => (
                  <option key={r} value={r}>{resourceLabel(r)}</option>
                ))}
              </select>
            </label>

            <label className={`ui-filter-field${outcome ? " ui-filter-field--active" : ""}`}>
              <span className="ui-filter-label">Outcome</span>
              <select value={outcome} onChange={(e) => filter(setOutcome)(e.target.value)} className="ui-input">
                {OUTCOMES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>

            <label className={`ui-filter-field${recordId ? " ui-filter-field--active" : ""}`}>
              <span className="ui-filter-label">Record #</span>
              <input
                inputMode="numeric"
                value={recordId}
                onChange={(e) => filter(setRecordId)(e.target.value)}
                placeholder="Any"
                className="ui-input ui-input--narrow"
              />
            </label>

            {filtering && (
              <button
                type="button"
                className="ui-button ui-button--secondary ui-filter-clear"
                onClick={() => {
                  setResource("");
                  setOutcome("");
                  setRecordId("");
                  setPage(0);
                }}
              >
                Clear filters
              </button>
            )}

            <div className="ui-filter-summary">
              {!loading && (
                <span aria-live="polite">
                  <strong>{total}</strong> {total === 1 ? "entry" : "entries"}
                </span>
              )}
            </div>
          </div>
        }
        footer={
          total > PAGE_SIZE && (
            <div className="audit-pager">
              <button
                type="button"
                className="ui-button ui-button--secondary ui-button--small"
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                Newer
              </button>
              <span className="ui-muted">
                Page {page + 1} of {lastPage + 1}
              </span>
              <button
                type="button"
                className="ui-button ui-button--secondary ui-button--small"
                disabled={page >= lastPage || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Older
              </button>
            </div>
          )
        }
      >
        {loading && rows.length === 0 ? (
          <p className="ui-row-empty">Loading the log…</p>
        ) : rows.length === 0 ? (
          <p className="ui-row-empty">{filtering ? "No entries match these filters." : "No deletions yet."}</p>
        ) : (
          <div className="ui-table-wrap">
            <table className="ui-table audit-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Record</th>
                  <th>Record #</th>
                  <th>Outcome</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.deletion_audit_id}>
                    <td className="audit-when">{formatUtc(r.occurred_at)}</td>
                    <td>{r.actor_username ?? <span className="ui-muted">Not signed in</span>}</td>
                    <td title={r.request_path}>{resourceLabel(r.resource)}</td>
                    <td>{r.resource_id ?? <span className="ui-muted">—</span>}</td>
                    <td>
                      <span className={`ui-badge ${OUTCOME_BADGE[r.outcome] ?? "ui-badge--muted"}`}>
                        {outcomeLabel(r.outcome)}
                      </span>
                      {r.status_code !== null && <div className="ui-muted audit-sub">{r.status_code}</div>}
                    </td>
                    <td className="audit-details">
                      {r.details ?? <span className="ui-muted">—</span>}
                      <div className="ui-muted audit-sub">
                        {r.request_path}
                        {r.client_ip && ` · ${r.client_ip}`}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
