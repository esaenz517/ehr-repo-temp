import { useState } from "react";
import { useBilling } from "../../hooks/useBilling";

interface BillingChargePanelProps {
  patientId: number;
}

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
    <div
      style={{
        marginTop: 12,
        padding: 12,
        border: "1px solid #ddd",
        borderRadius: 6,
      }}
    >
      <h3>Billing / Charges</h3>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>
            Charge Summary:{" "}
            <input
              type="text"
              value={chargeSummary}
              onChange={(event) =>
                setChargeSummary(event.target.value)
              }
              placeholder="Office Visit"
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>
            Charge Amount: ${" "}
            <input
              type="number"
              min="0"
              step="0.01"
              value={chargeAmount}
              onChange={(event) =>
                setChargeAmount(event.target.value)
              }
              placeholder="125.00"
              required
            />
          </label>
        </div>

        <button type="submit">Add Charge</button>
      </form>

      {loading && <p>Loading charges...</p>}
      {error && <p>{error}</p>}

      {charges.length === 0 && !loading ? (
        <p>No charges.</p>
      ) : (
        <ul>
          {charges.map((charge) => (
            <li
              key={charge.charge_id}
              style={{ marginTop: 10 }}
            >
              <strong>{charge.charge_summary}</strong>

              <div>
                Amount: ${Number(charge.charge_amount).toFixed(2)}
              </div>

              <button
                type="button"
                onClick={() => removeCharge(charge.charge_id)}
                style={{ marginTop: 6 }}
              >
                Delete Charge
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}