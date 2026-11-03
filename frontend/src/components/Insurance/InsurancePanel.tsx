
import { useState } from "react";
import type { FormEvent } from "react";
import { useInsurance } from "../../hooks/useInsurance";
import type { InsuranceInput } from "../../api/insurance";

interface InsurancePanelProps {
  patientId: number;
}

const emptyForm: InsuranceInput = {
  insurance_company: "",
  member_id: "",
  group_number: null,
  policyholder_name: "",
  policyholder_date_of_birth: null,
  insurance_priority: "primary",
  coverage_start_date: null,
  coverage_end_date: null,
};

export function InsurancePanel({ patientId }: InsurancePanelProps) {
  const {
    insurance,
    loading,
    saving,
    error,
    createInsurance,
  } = useInsurance(patientId);

  const [form, setForm] = useState<InsuranceInput>({ ...emptyForm });
  const [showForm, setShowForm] = useState(false);

  const updateField = <K extends keyof InsuranceInput>(
    field: K,
    value: InsuranceInput[K]
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      form.coverage_start_date &&
      form.coverage_end_date &&
      form.coverage_end_date < form.coverage_start_date
    ) {
      return;
    }

    const success = await createInsurance({
      ...form,
      insurance_company: form.insurance_company.trim(),
      member_id: form.member_id.trim(),
      policyholder_name: form.policyholder_name.trim(),
      group_number: form.group_number?.trim() || null,
    });

    if (success) {
      setForm({ ...emptyForm });
      setShowForm(false);
    }
  };

  return (
    <section className="ui-row-detail">
      <h3>Patient Insurance</h3>

      {error && <p className="ui-error" role="alert">{error}</p>}

      {loading ? (
        <p>Loading insurance...</p>
      ) : insurance.length === 0 ? (
        <p>No insurance registered for this patient.</p>
      ) : (
        <div>
          {insurance.map((policy) => (
            <div key={policy.insurance_id} className="ui-row-detail">
              <h4>{policy.insurance_company}</h4>
              <dl className="ui-detail-list">
                <dt>Member ID</dt>
                <dd>{policy.member_id}</dd>

                <dt>Group number</dt>
                <dd>{policy.group_number || "—"}</dd>

                <dt>Policyholder</dt>
                <dd>{policy.policyholder_name}</dd>

                <dt>Priority</dt>
                <dd>{policy.insurance_priority}</dd>

                <dt>Verification</dt>
                <dd>{policy.verification_status.split("_").join(" ")}</dd>

                <dt>Coverage start</dt>
                <dd>{policy.coverage_start_date || "—"}</dd>

                <dt>Coverage end</dt>
                <dd>{policy.coverage_end_date || "—"}</dd>
              </dl>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="ui-button"
        onClick={() => setShowForm((previous) => !previous)}
      >
        {showForm ? "Cancel" : "Add Insurance"}
      </button>

      {showForm && (
        <form className="insurance-form" onSubmit={handleSubmit}>
          <h4>Register Insurance</h4>

          <label>
            Insurance company *
            <input
              required
              maxLength={150}
              value={form.insurance_company}
              onChange={(e) =>
                updateField("insurance_company", e.target.value)
              }
            />
          </label>

          <label>
            Member ID *
            <input
              required
              maxLength={100}
              value={form.member_id}
              onChange={(e) => updateField("member_id", e.target.value)}
            />
          </label>

          <label>
            Group number
            <input
              maxLength={100}
              value={form.group_number ?? ""}
              onChange={(e) =>
                updateField("group_number", e.target.value || null)
              }
            />
          </label>

          <label>
            Policyholder name *
            <input
              required
              maxLength={200}
              value={form.policyholder_name}
              onChange={(e) =>
                updateField("policyholder_name", e.target.value)
              }
            />
          </label>

          <label>
            Policyholder date of birth
            <input
              type="date"
              value={form.policyholder_date_of_birth ?? ""}
              onChange={(e) =>
                updateField(
                  "policyholder_date_of_birth",
                  e.target.value || null
                )
              }
            />
          </label>

          <label>
            Insurance priority *
            <select
              value={form.insurance_priority}
              onChange={(e) =>
                updateField(
                  "insurance_priority",
                  e.target.value as InsuranceInput["insurance_priority"]
                )
              }
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
            </select>
          </label>

          <label>
            Coverage start date
            <input
              type="date"
              value={form.coverage_start_date ?? ""}
              onChange={(e) =>
                updateField("coverage_start_date", e.target.value || null)
              }
            />
          </label>

          <label>
            Coverage end date
            <input
              type="date"
              min={form.coverage_start_date ?? undefined}
              value={form.coverage_end_date ?? ""}
              onChange={(e) =>
                updateField("coverage_end_date", e.target.value || null)
              }
            />
          </label>

          <p>Insurance will remain Unverified until eligibility is checked.</p>

          <button type="submit" className="ui-button" disabled={saving}>
            {saving ? "Saving..." : "Save Insurance"}
          </button>
        </form>
      )}
    </section>
  );
}
