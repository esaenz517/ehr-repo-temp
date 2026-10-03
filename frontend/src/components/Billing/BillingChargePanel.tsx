import { useState } from "react";
import { useBilling } from "../../hooks/useBilling";
import "./billing.css";

interface BillingChargePanelProps {
  patientId: number;
}

// Amounts come back from the API as strings (e.g. "125.00"); show them as $125.00
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const formatMoney = (amount: string | number) => money.format(Number(amount));

export function BillingChargePanel({
  patientId,
}: BillingChargePanelProps) {
  const {
    charges,
    loading,
    error,
    createCharge,
    removeCharge,
  } = useBilling(patientId);

  const [chargeSummary, setChargeSummary] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");

  const total = charges.reduce((sum, charge) => sum + Number(charge.charge_amount), 0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!chargeSummary.trim() || !chargeAmount) {
      return;
    }

    await createCharge({
      charge_summary: chargeSummary.trim(),
      charge_amount: chargeAmount,
    });

    setChargeSummary("");
    setChargeAmount("");
  };

  return (
    <div className="billing-panel">
      <div className="billing-header">
        <h3 className="billing-title">Billing / Charges</h3>
        {charges.length > 0 && (
          <span className="billing-total-badge">Total {formatMoney(total)}</span>
        )}
      </div>

      {error && <p className="ui-error">{error}</p>}

      {loading ? (
        <p className="billing-muted">Loading charges...</p>
      ) : charges.length === 0 ? (
        <p className="billing-empty">No charges yet.</p>
      ) : (
        <table className="billing-table">
          <thead>
            <tr>
              <th scope="col">Charge</th>
              <th scope="col" className="billing-amount">Amount</th>
              <th scope="col" className="billing-actions">
                <span className="ui-visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {charges.map((charge) => (
              <tr key={charge.charge_id}>
                <td>{charge.charge_summary}</td>
                <td className="billing-amount">{formatMoney(charge.charge_amount)}</td>
                <td className="billing-actions">
                  <button
                    type="button"
                    className="ui-button ui-button--danger billing-delete"
                    onClick={() => removeCharge(charge.charge_id)}
                    aria-label={`Delete charge ${charge.charge_summary}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td className="billing-amount">{formatMoney(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      )}

      <form onSubmit={handleSubmit} className="billing-form">
        <div className="billing-field billing-field--summary">
          <label htmlFor={`charge-summary-${patientId}`} className="billing-label">
            Charge summary
          </label>
          <input
            id={`charge-summary-${patientId}`}
            type="text"
            value={chargeSummary}
            onChange={(event) => setChargeSummary(event.target.value)}
            placeholder="Office visit"
            required
            className="billing-input"
          />
        </div>

        <div className="billing-field billing-field--amount">
          <label htmlFor={`charge-amount-${patientId}`} className="billing-label">
            Amount
          </label>
          <div className="billing-money">
            <span className="billing-money-symbol" aria-hidden="true">$</span>
            <input
              id={`charge-amount-${patientId}`}
              type="number"
              min="0"
              step="0.01"
              value={chargeAmount}
              onChange={(event) => setChargeAmount(event.target.value)}
              placeholder="0.00"
              required
              className="billing-input"
            />
          </div>
        </div>

        <button type="submit" className="ui-button billing-submit">Add charge</button>
      </form>
    </div>
  );
}
