import { portalApi } from "../../api/portal";
import { usePortal } from "../../hooks/usePortal";
import type { PortalVital } from "../../types";
import { PageHeader } from "../PageHeader";
import { Panel } from "../Panel";
import { formatUtc, isAbnormal } from "./format";
import "./portal.css";

const show = (value: string | number | null, unit = "") =>
  value === null || value === "" ? <span className="ui-muted">—</span> : `${Number.isNaN(Number(value)) ? value : Number(value)}${unit}`;

const VITAL_COLUMNS: { label: string; cell: (v: PortalVital) => React.ReactNode }[] = [
  { label: "Blood pressure", cell: (v) => show(v.blood_pressure) },
  { label: "Heart rate", cell: (v) => show(v.heart_rate, " bpm") },
  { label: "Breathing rate", cell: (v) => show(v.respiratory_rate, "/min") },
  { label: "Temperature", cell: (v) => show(v.temperature_c, " °C") },
  { label: "Oxygen", cell: (v) => show(v.oxygen_saturation, "%") },
  { label: "Weight", cell: (v) => show(v.weight_kg, " kg") },
  { label: "Height", cell: (v) => show(v.height_cm, " cm") },
];

// Lab results (newest first, out-of-range ones highlighted) and vital signs.
export function PortalResults() {
  const labs = usePortal(portalApi.labResults);
  const vitals = usePortal(portalApi.vitals);

  return (
    <div className="ui-page">
      <PageHeader title="Test Results" description="Lab results and vital signs from your visits, newest first." />

      <Panel title="Lab results">
        {labs.error && <p className="ui-error">{labs.error}</p>}
        {labs.loading ? (
          <p className="ui-muted">Loading…</p>
        ) : !labs.data?.length ? (
          <p className="ui-muted">No lab results yet.</p>
        ) : (
          <ul className="ui-lab-list">
            {labs.data.map((l) => {
              const abnormal = isAbnormal(l.flag);
              return (
                <li key={l.lab_result_id} className={`ui-lab${abnormal ? " ui-lab--abnormal" : ""}`}>
                  <strong>{l.test_name}</strong>: {l.result} {l.unit ?? ""}
                  {l.flag && (
                    <span className={`ui-badge ${abnormal ? "ui-badge--error" : "ui-badge--success"}`}>{l.flag}</span>
                  )}
                  <span className="ui-muted"> · {formatUtc(l.collected_at)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Vital signs" flush>
        {vitals.error && <p className="ui-error">{vitals.error}</p>}
        {vitals.loading ? (
          <p className="ui-row-empty">Loading…</p>
        ) : !vitals.data?.length ? (
          <p className="ui-row-empty">No vital signs recorded yet.</p>
        ) : (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th scope="col">Recorded</th>
                  {VITAL_COLUMNS.map((c) => <th key={c.label} scope="col">{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {vitals.data.map((v) => (
                  <tr key={v.vital_id}>
                    <td>{formatUtc(v.recorded_at)}</td>
                    {VITAL_COLUMNS.map((c) => <td key={c.label}>{c.cell(v)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="portal-footnote">Your provider will go over results with you. Contact your clinic if you have questions.</p>
    </div>
  );
}
