import { portalApi } from "../../api/portal";
import { usePortal } from "../../hooks/usePortal";
import { PageHeader } from "../PageHeader";
import { Panel } from "../Panel";
import { capitalize, formatDate, formatMoney } from "./format";
import "./portal.css";

// Verification statuses from dbo.PatientInsurance, in patient-friendly words
const COVERAGE_LABELS: Record<string, { text: string; badge: string }> = {
  verified_active: { text: "Active", badge: "ui-badge ui-badge--success" },
  verified_inactive: { text: "Inactive", badge: "ui-badge ui-badge--error" },
  unverified: { text: "Not yet verified", badge: "ui-badge ui-badge--muted" },
  unable_to_verify: { text: "Could not verify", badge: "ui-badge ui-badge--warning" },
};

// Charges on the account with the total, and insurance plans on file.
export function PortalBilling() {
  const billing = usePortal(portalApi.billing);
  const insurance = usePortal(portalApi.insurance);
  const charges = billing.data?.charges ?? [];

  return (
    <div className="ui-page">
      <PageHeader title="Billing & Insurance" description="Charges on your account and the insurance we have on file." />

      <Panel
        title="Charges"
        actions={billing.data && charges.length > 0 && (
          <span className="ui-badge ui-badge--solid">Total {formatMoney(billing.data.total)}</span>
        )}
        flush
      >
        {billing.error && <p className="ui-error">{billing.error}</p>}
        {billing.loading ? (
          <p className="ui-row-empty">Loading charges…</p>
        ) : charges.length === 0 ? (
          <p className="ui-row-empty">You have no charges.</p>
        ) : (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th scope="col">Service</th>
                  <th scope="col" className="ui-num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((c) => (
                  <tr key={c.charge_id}>
                    <td>{c.charge_summary}</td>
                    <td className="ui-num">{formatMoney(c.charge_amount)}</td>
                  </tr>
                ))}
                <tr className="portal-total">
                  <td>Total</td>
                  <td className="ui-num">{formatMoney(billing.data!.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Insurance" flush>
        {insurance.error && <p className="ui-error">{insurance.error}</p>}
        {insurance.loading ? (
          <p className="ui-row-empty">Loading insurance…</p>
        ) : !insurance.data?.length ? (
          <p className="ui-row-empty">No insurance on file.</p>
        ) : (
          <ul className="ui-row-list">
            {insurance.data.map((plan) => {
              const coverage = COVERAGE_LABELS[plan.verification_status] ?? {
                text: capitalize(plan.verification_status),
                badge: "ui-badge ui-badge--muted",
              };
              return (
                <li key={plan.insurance_id} className="ui-row ui-row--wrap">
                  <div className="ui-row-main">
                    <div className="ui-row-title">
                      {plan.insurance_company}{" "}
                      <span className="ui-badge ui-badge--muted">{capitalize(plan.insurance_priority)}</span>
                    </div>
                    <div className="ui-row-subtitle">
                      Member ID {plan.member_id}
                      {plan.group_number && <> · Group {plan.group_number}</>}
                      {" · "}Policyholder {plan.policyholder_name}
                    </div>
                    <div className="ui-row-subtitle">
                      Coverage {formatDate(plan.coverage_start_date)} – {plan.coverage_end_date ? formatDate(plan.coverage_end_date) : "present"}
                    </div>
                  </div>
                  <span className={coverage.badge}>{coverage.text}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <p className="portal-footnote">Questions about a bill or your coverage? Contact the billing office.</p>
    </div>
  );
}
