import type { Drug } from "../../types";
import { Cell, RemoveButton, RowGroup } from "./RowGroup";

// Dropdown options, same as the EMR mockup.
const ROUTES = ["PO", "SC", "IM", "IV", "Topical"];
const FREQUENCIES = ["Once daily", "Twice daily (BID)", "Three times daily (TID)", "Nightly (QHS)", "Once weekly", "As needed (PRN)"];
const FLAGS = ["Normal", "High", "Low"];

// One medication row in the form.
export interface MedicationRow {
  drugId: string; // the <select> value; converted to a number when saving
  dose: string;
  route: string;
  frequency: string;
}

// One allergy row in the form.
export interface AllergyRow {
  substance: string;
  reaction: string;
}

// One lab result row in the form.
export interface LabRow {
  testName: string;
  result: string;
  unit: string;
  flag: string;
  collectedAt: string; // "YYYY-MM-DDTHH:mm" from the datetime-local input
}

// The values this section collects. The state itself lives in useCreateCase.
export interface ChartDataValues {
  medications: MedicationRow[];
  allergies: AllergyRow[];
  labs: LabRow[];
}

// Starting (blank) values for the form.
export const EMPTY_CHART_DATA: ChartDataValues = { medications: [], allergies: [], labs: [] };

// Blank rows added by the "Add" buttons.
const EMPTY_MEDICATION: MedicationRow = { drugId: "", dose: "", route: "", frequency: "" };
const EMPTY_ALLERGY: AllergyRow = { substance: "", reaction: "" };
const EMPTY_LAB: LabRow = { testName: "", result: "", unit: "", flag: "", collectedAt: "" };

interface ChartDataProps {
  values: ChartDataValues;
  drugs: Drug[]; // every drug the instructor can pick from
  onChange: (values: ChartDataValues) => void; // sends the whole updated section back up
  errors: Partial<Record<keyof ChartDataValues, string>>;
  readOnly?: boolean;
}

// Chart Data section of the Create Case page: medications, allergies, and labs.
export function ChartData({ values, drugs, onChange, errors, readOnly = false, }: ChartDataProps) {
  // Change one field in one medication row.
  const updateMedication = (index: number, field: keyof MedicationRow, value: string) =>
    onChange({
      ...values,
      medications: values.medications.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    });

  // Change one field in one allergy row.
  const updateAllergy = (index: number, field: keyof AllergyRow, value: string) =>
    onChange({
      ...values,
      allergies: values.allergies.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    });

  // Change one field in one lab row.
  const updateLab = (index: number, field: keyof LabRow, value: string) =>
    onChange({
      ...values,
      labs: values.labs.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    });

  // Add a blank row, or remove the row at index.
  const addMedication = () =>
    onChange({ ...values, medications: [...values.medications, EMPTY_MEDICATION] });
  const removeMedication = (index: number) =>
    onChange({ ...values, medications: values.medications.filter((_, i) => i !== index) });
  const addAllergy = () => onChange({ ...values, allergies: [...values.allergies, EMPTY_ALLERGY] });
  const removeAllergy = (index: number) =>
    onChange({ ...values, allergies: values.allergies.filter((_, i) => i !== index) });
  const addLab = () => onChange({ ...values, labs: [...values.labs, EMPTY_LAB] });
  const removeLab = (index: number) =>
    onChange({ ...values, labs: values.labs.filter((_, i) => i !== index) });

  const drugName = (drugId: string) => drugs.find((d) => String(d.drug_id) === drugId)?.name ?? "";

  // Existing patients show their chart as text; new patients get editable rows.
  // Remove buttons are type="button" (inside RemoveButton) so they don't submit the whole form.
  return (
    <div className="form-stack">
      {/* Medications: one row per drug, picked from the drugs already in the system */}
      <RowGroup
        title="Medications"
        count={values.medications.length}
        columns={["Drug *", "Dose", "Route", "Frequency"]}
        layout="meds"
        emptyText={readOnly ? "No medications on file." : drugs.length === 0 ? "No drugs yet. Add them on the Drugs page." : "No medications added."}
        addLabel="Add medication"
        onAdd={addMedication}
        readOnly={readOnly}
        error={errors.medications}
      >
        {values.medications.map((row, i) =>
          readOnly ? (
            <div key={i} className="case-grid-row case-grid-row--readonly">
              <Cell label="Drug"><strong>{drugName(row.drugId)}</strong></Cell>
              <Cell label="Dose">{row.dose}</Cell>
              <Cell label="Route">{row.route}</Cell>
              <Cell label="Frequency">{row.frequency}</Cell>
            </div>
          ) : (
            <div key={i} className="case-grid-row">
              <select
                className="ui-input"
                aria-label="Drug"
                value={row.drugId}
                onChange={(e) => updateMedication(i, "drugId", e.target.value)}
              >
                <option value="">Select drug</option>
                {drugs.map((drug) => (
                  <option key={drug.drug_id} value={drug.drug_id}>{drug.name}</option>
                ))}
              </select>
              <input
                className="ui-input"
                aria-label="Dose"
                placeholder="e.g. 500 mg"
                value={row.dose}
                onChange={(e) => updateMedication(i, "dose", e.target.value)}
              />
              <select
                className="ui-input"
                aria-label="Route"
                value={row.route}
                onChange={(e) => updateMedication(i, "route", e.target.value)}
              >
                <option value="">Route</option>
                {ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select
                className="ui-input"
                aria-label="Frequency"
                value={row.frequency}
                onChange={(e) => updateMedication(i, "frequency", e.target.value)}
              >
                <option value="">Frequency</option>
                {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <RemoveButton label={`Remove medication ${i + 1}`} onClick={() => removeMedication(i)} />
            </div>
          )
        )}
      </RowGroup>

      {/* Allergies: one row per allergy */}
      <RowGroup
        title="Allergies"
        count={values.allergies.length}
        columns={["Substance *", "Reaction"]}
        layout="allergies"
        emptyText={readOnly ? "No known allergies on file." : "No allergies added."}
        addLabel="Add allergy"
        onAdd={addAllergy}
        readOnly={readOnly}
        error={errors.allergies}
      >
        {values.allergies.map((row, i) =>
          readOnly ? (
            <div key={i} className="case-grid-row case-grid-row--readonly">
              <Cell label="Substance"><strong>{row.substance}</strong></Cell>
              <Cell label="Reaction">{row.reaction}</Cell>
            </div>
          ) : (
            <div key={i} className="case-grid-row">
              <input
                className="ui-input"
                aria-label="Substance"
                placeholder="e.g. Penicillin"
                value={row.substance}
                onChange={(e) => updateAllergy(i, "substance", e.target.value)}
              />
              <input
                className="ui-input"
                aria-label="Reaction"
                placeholder="e.g. Hives"
                value={row.reaction}
                onChange={(e) => updateAllergy(i, "reaction", e.target.value)}
              />
              <RemoveButton label={`Remove allergy ${i + 1}`} onClick={() => removeAllergy(i)} />
            </div>
          )
        )}
      </RowGroup>

      {/* Labs: one row per lab result */}
      <RowGroup
        title="Labs"
        count={values.labs.length}
        columns={["Test *", "Result *", "Unit", "Flag", "Collected *"]}
        layout="labs"
        emptyText={readOnly ? "No recent labs on file." : "No labs added."}
        addLabel="Add lab"
        onAdd={addLab}
        readOnly={readOnly}
        error={errors.labs}
      >
        {values.labs.map((row, i) =>
          readOnly ? (
            <div key={i} className="case-grid-row case-grid-row--readonly">
              <Cell label="Test"><strong>{row.testName}</strong></Cell>
              <Cell label="Result">{row.result}</Cell>
              <Cell label="Unit">{row.unit}</Cell>
              <Cell label="Flag">
                {row.flag && (
                  <span className={`ui-badge ${row.flag === "Normal" ? "ui-badge--success" : "ui-badge--error"}`}>
                    {row.flag}
                  </span>
                )}
              </Cell>
              <Cell label="Collected">{row.collectedAt && new Date(row.collectedAt).toLocaleString()}</Cell>
            </div>
          ) : (
            <div key={i} className="case-grid-row">
              <input
                className="ui-input"
                aria-label="Test name"
                placeholder="e.g. INR"
                value={row.testName}
                onChange={(e) => updateLab(i, "testName", e.target.value)}
              />
              <input
                className="ui-input"
                aria-label="Result"
                placeholder="e.g. 3.8"
                value={row.result}
                onChange={(e) => updateLab(i, "result", e.target.value)}
              />
              <input
                className="ui-input"
                aria-label="Unit"
                placeholder="Unit"
                value={row.unit}
                onChange={(e) => updateLab(i, "unit", e.target.value)}
              />
              <select
                className="ui-input"
                aria-label="Flag"
                value={row.flag}
                onChange={(e) => updateLab(i, "flag", e.target.value)}
              >
                <option value="">Flag</option>
                {FLAGS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <input
                className="ui-input"
                type="datetime-local"
                aria-label="Collected at"
                value={row.collectedAt}
                onChange={(e) => updateLab(i, "collectedAt", e.target.value)}
              />
              <RemoveButton label={`Remove lab ${i + 1}`} onClick={() => removeLab(i)} />
            </div>
          )
        )}
      </RowGroup>
    </div>
  );
}
