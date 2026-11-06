import { portalApi } from "../../api/portal";
import { usePortal } from "../../hooks/usePortal";
import { PageHeader } from "../PageHeader";
import { Panel } from "../Panel";
import { formatDate } from "./format";
import "./portal.css";

// The patient's own conditions and their family's health history.
export function PortalHistory() {
  const medical = usePortal(portalApi.medicalHistory);
  const family = usePortal(portalApi.familyHistory);

  return (
    <div className="ui-page">
      <PageHeader title="Medical History" description="Conditions on your record and your family health history." />

      <div className="portal-columns">
        <Panel title="My conditions" flush>
          {medical.error && <p className="ui-error">{medical.error}</p>}
          {medical.loading ? (
            <p className="ui-row-empty">Loading…</p>
          ) : !medical.data?.length ? (
            <p className="ui-row-empty">No conditions on file.</p>
          ) : (
            <ul className="ui-row-list">
              {medical.data.map((h) => (
                <li key={h.medical_history_id} className="ui-row">
                  <div className="ui-row-main">
                    <div className="ui-row-title">{h.condition}</div>
                    {h.notes && <div className="ui-row-subtitle">{h.notes}</div>}
                  </div>
                  {h.diagnosis_date && (
                    <span className="ui-badge ui-badge--muted">Since {formatDate(h.diagnosis_date)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Family history" flush>
          {family.error && <p className="ui-error">{family.error}</p>}
          {family.loading ? (
            <p className="ui-row-empty">Loading…</p>
          ) : !family.data?.length ? (
            <p className="ui-row-empty">No family history on file.</p>
          ) : (
            <ul className="ui-row-list">
              {family.data.map((f) => (
                <li key={f.family_history_id} className="ui-row">
                  <div className="ui-row-main">
                    <div className="ui-row-title">{f.condition}</div>
                    {f.notes && <div className="ui-row-subtitle">{f.notes}</div>}
                  </div>
                  <span className="ui-badge ui-badge--muted">{f.relationship}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <p className="portal-footnote">If something here looks wrong or is missing, let your care team know at your next visit.</p>
    </div>
  );
}
