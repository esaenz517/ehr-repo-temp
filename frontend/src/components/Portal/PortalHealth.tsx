import { portalApi } from "../../api/portal";
import { usePortal } from "../../hooks/usePortal";
import { PageHeader } from "../PageHeader";
import { Panel } from "../Panel";
import "./portal.css";

// Current medications and known allergies.
export function PortalHealth() {
  const medications = usePortal(portalApi.medications);
  const allergies = usePortal(portalApi.allergies);

  return (
    <div className="ui-page">
      <PageHeader title="Medications & Allergies" description="Medicines on your record and anything you're allergic to." />

      <Panel title="Medications" flush>
        {medications.error && <p className="ui-error">{medications.error}</p>}
        {medications.loading ? (
          <p className="ui-row-empty">Loading…</p>
        ) : !medications.data?.length ? (
          <p className="ui-row-empty">No medications on file.</p>
        ) : (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th scope="col">Medication</th>
                  <th scope="col">Dose</th>
                  <th scope="col">How to take</th>
                  <th scope="col">How often</th>
                </tr>
              </thead>
              <tbody>
                {medications.data.map((m) => (
                  <tr key={m.drug_id}>
                    <td><strong>{m.name}</strong></td>
                    <td>{m.dosage ?? <span className="ui-muted">—</span>}</td>
                    <td>{m.route ?? <span className="ui-muted">—</span>}</td>
                    <td>{m.frequency ?? <span className="ui-muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Allergies" flush>
        {allergies.error && <p className="ui-error">{allergies.error}</p>}
        {allergies.loading ? (
          <p className="ui-row-empty">Loading…</p>
        ) : !allergies.data?.length ? (
          <p className="ui-row-empty">No known allergies on file.</p>
        ) : (
          <ul className="ui-row-list">
            {allergies.data.map((a) => (
              <li key={a.allergy_id} className="ui-row portal-allergy">
                <div className="ui-row-main">
                  <div className="ui-row-title">{a.substance}</div>
                  {a.reaction && <div className="ui-row-subtitle">Reaction: {a.reaction}</div>}
                </div>
                <span className="ui-badge ui-badge--error">Allergy</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <p className="portal-footnote">Don't stop or change a medicine without talking to your provider.</p>
    </div>
  );
}
