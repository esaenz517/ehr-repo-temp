import { useEffect, useState } from "react";
import { formatUtc } from "../../api/clinicalNotes";
import { noteAccessLogApi, type NoteAccessEntry, type NoteAccessOutcome } from "../../api/noteAccessLog";
import { roleName } from "../../access";
import { useNoteTemplates } from "../../hooks/useNoteTemplates";
import { Panel } from "../Panel";
import "./audit.css";

// AI was utilized to assist with this frontend module

const PAGE_SIZE = 50;

const ACTIONS: { value: string; label: string }[] = [
  { value: "", label: "All actions" },
  { value: "list", label: "Listed notes" },
  { value: "create", label: "Created" },
  { value: "read", label: "Viewed" },
  { value: "update", label: "Edited" },
  { value: "archive", label: "Archived" },
  { value: "read_versions", label: "Viewed history" },
  { value: "read_addenda", label: "Viewed corrections" },
  { value: "add_addendum", label: "Added correction" },
  { value: "submit", label: "Submitted" },
  { value: "review", label: "Signed off / sent back" },
  { value: "view_log", label: "Viewed this log" },
];

const OUTCOMES: { value: "" | NoteAccessOutcome; label: string }[] = [
  { value: "", label: "All outcomes" },
  { value: "success", label: "Allowed" },
  { value: "denied", label: "Denied" },
  { value: "unauthenticated", label: "Not signed in" },
  { value: "not_found", label: "Not found" },
  { value: "conflict", label: "Conflict" },
  { value: "invalid", label: "Invalid request" },
  { value: "error", label: "Server error" },
];

const OUTCOME_BADGE: Record<NoteAccessOutcome, string> = {
  success: "ui-badge--signed",
  denied: "ui-badge--error",
  unauthenticated: "ui-badge--error",
  error: "ui-badge--error",
  not_found: "ui-badge--muted",
  conflict: "ui-badge--muted",
  invalid: "ui-badge--muted",
};

const label = (list: { value: string; label: string }[], value: string) =>
  list.find((o) => o.value === value)?.label ?? value;

// "12" -> 12, anything else -> undefined (an empty or invalid filter)
const asId = (text: string) => (/^\d+$/.test(text.trim()) ? Number(text.trim()) : undefined);

// The Note access tab of the Audit Log page (admin only): every clinical note
// view and change, and every refused attempt. Refused attempts on psychiatry,
// psychotherapy and SUD notes are red-flagged.
export function NoteAccessLogTab() {
  const { templates } = useNoteTemplates();
  const typeLabel = (id: string) => templates.find((t) => t.id === id)?.label ?? id;

  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [action, setAction] = useState("");
  const [outcome, setOutcome] = useState("");
  const [noteId, setNoteId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [page, setPage] = useState(0);

  const [rows, setRows] = useState<NoteAccessEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [flaggedTotal, setFlaggedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setLoading(true);
    noteAccessLogApi
      .list({
        action: action || undefined,
        outcome: outcome || undefined,
        note_id: asId(noteId),
        patient_id: asId(patientId),
        flagged: flaggedOnly || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      .then((result) => {
        if (!live) return;
        setRows(result.items);
        setTotal(result.total);
        setFlaggedTotal(result.flagged_total);
        setError(null);
      })
      .catch((e: Error) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [action, outcome, noteId, patientId, flaggedOnly, page]);

  // Any filter change starts again at the first page
  const filter = (set: (value: string) => void) => (value: string) => {
    set(value);
    setPage(0);
  };

  const filtering = flaggedOnly || action || outcome || noteId || patientId;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <>
      <p className="ui-muted audit-intro">
        Every clinical note view and change, and every refused or failed attempt.
      </p>

      {error && <p className="ui-error">{error}</p>}

      {flaggedTotal > 0 && !flaggedOnly && (
        <div className="audit-flag-banner" role="alert">
          <span>
            <strong>⚑ {flaggedTotal} red {flaggedTotal === 1 ? "flag" : "flags"}</strong>
            {filtering ? " match these filters" : ""}: someone was refused, or wasn't signed in, when trying to
            open or change a psychiatry, psychotherapy or SUD note.
          </span>
          <button
            type="button"
            className="ui-button ui-button--small"
            onClick={() => {
              setFlaggedOnly(true);
              setPage(0);
            }}
          >
            Show red flags
          </button>
        </div>
      )}

      <Panel
        flush
        toolbar={
          <div className="ui-filter-bar" role="search" aria-label="Filter the note access log">
            <label className={`ui-filter-field audit-flag-toggle${flaggedOnly ? " ui-filter-field--active" : ""}`}>
              <input
                type="checkbox"
                checked={flaggedOnly}
                onChange={(e) => {
                  setFlaggedOnly(e.target.checked);
                  setPage(0);
                }}
              />
              <span>Red flags only</span>
            </label>

            <label className={`ui-filter-field${action ? " ui-filter-field--active" : ""}`}>
              <span className="ui-filter-label">Action</span>
              <select value={action} onChange={(e) => filter(setAction)(e.target.value)} className="ui-input">
                {ACTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
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

            <label className={`ui-filter-field${noteId ? " ui-filter-field--active" : ""}`}>
              <span className="ui-filter-label">Note #</span>
              <input
                inputMode="numeric"
                value={noteId}
                onChange={(e) => filter(setNoteId)(e.target.value)}
                placeholder="Any"
                className="ui-input ui-input--narrow"
              />
            </label>

            <label className={`ui-filter-field${patientId ? " ui-filter-field--active" : ""}`}>
              <span className="ui-filter-label">Patient #</span>
              <input
                inputMode="numeric"
                value={patientId}
                onChange={(e) => filter(setPatientId)(e.target.value)}
                placeholder="Any"
                className="ui-input ui-input--narrow"
              />
            </label>

            {filtering && (
              <button
                type="button"
                className="ui-button ui-button--secondary ui-filter-clear"
                onClick={() => {
                  setFlaggedOnly(false);
                  setAction("");
                  setOutcome("");
                  setNoteId("");
                  setPatientId("");
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
          <p className="ui-row-empty">{filtering ? "No entries match these filters." : "No note activity yet."}</p>
        ) : (
          <div className="ui-table-wrap">
            <table className="ui-table audit-table">
              <thead>
                <tr>
                  <th aria-label="Red flag" />
                  <th>When</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Outcome</th>
                  <th>Note</th>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.note_access_log_id} className={r.flagged ? "audit-row--flagged" : undefined}>
                    <td className="audit-flag">
                      {r.flagged && (
                        <span className="audit-flag-icon" role="img" aria-label="Red flag" title="Red flag">
                          ⚑
                        </span>
                      )}
                    </td>
                    <td className="audit-when">{formatUtc(r.occurred_at)}</td>
                    <td>
                      {r.actor_username ?? <span className="ui-muted">Not signed in</span>}
                      {r.actor_role && <div className="ui-muted audit-sub">{roleName(r.actor_role)}</div>}
                    </td>
                    <td title={`${r.method} ${r.request_path}`}>{label(ACTIONS, r.action)}</td>
                    <td>
                      <span className={`ui-badge ${OUTCOME_BADGE[r.outcome] ?? "ui-badge--muted"}`}>
                        {label(OUTCOMES, r.outcome)}
                      </span>
                      {r.status_code !== null && <div className="ui-muted audit-sub">{r.status_code}</div>}
                    </td>
                    <td>{r.note_id ?? <span className="ui-muted">—</span>}</td>
                    <td>{r.patient_id ?? <span className="ui-muted">—</span>}</td>
                    <td>{r.note_type ? typeLabel(r.note_type) : <span className="ui-muted">—</span>}</td>
                    <td className="audit-details">
                      {r.details ?? <span className="ui-muted">—</span>}
                      {r.client_ip && <div className="ui-muted audit-sub">{r.client_ip}</div>}
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
