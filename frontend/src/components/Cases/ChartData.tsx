import type { Drug } from "../../types";

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

// Lays out one row of inputs side by side.
const rowStyle = { display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 8 };

// Small heading above each list.
const headingStyle = { fontSize: 14, margin: "0 0 8px" };

interface ChartDataProps {
  values: ChartDataValues;
  drugs: Drug[]; // every drug the instructor can pick from
  onChange: (values: ChartDataValues) => void; // sends the whole updated section back up
  errors: Partial<Record<keyof ChartDataValues, string>>;
}

// Chart Data section of the Create Case page: medications, allergies, and labs.
export function ChartData({ values, drugs, onChange, errors }: ChartDataProps) {
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

  // Every button below is type="button" so it doesn't submit the whole form.
  return (
    <div className="form-stack">
      {/* Medications: one row per drug, picked from the drugs already in the system */}
      <div>
        <h3 style={headingStyle}>Medications</h3>
        {drugs.length === 0 && <p className="field-hint">No drugs yet. Add them on the Drugs page.</p>}
        {values.medications.map((row, i) => (
          <div key={i} style={rowStyle}>
            <select
              aria-label="Drug"
              value={row.drugId}
              onChange={(e) => updateMedication(i, "drugId", e.target.value)}
            >
              <option value="">Drug *</option>
              {drugs.map((drug) => (
                <option key={drug.drug_id} value={drug.drug_id}>{drug.name}</option>
              ))}
            </select>
            <input
              aria-label="Dose"
              placeholder="Dose (e.g. 500 mg)"
              value={row.dose}
              onChange={(e) => updateMedication(i, "dose", e.target.value)}
            />
            <select
              aria-label="Route"
              value={row.route}
              onChange={(e) => updateMedication(i, "route", e.target.value)}
            >
              <option value="">Route</option>
              {ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              aria-label="Frequency"
              value={row.frequency}
              onChange={(e) => updateMedication(i, "frequency", e.target.value)}
            >
              <option value="">Frequency</option>
              {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <button type="button" onClick={() => removeMedication(i)}>Remove</button>
          </div>
        ))}
        {errors.medications && <p className="field-error">{errors.medications}</p>}
        <button type="button" onClick={addMedication}>Add medication</button>
      </div>

      {/* Allergies: one row per allergy */}
      <div>
        <h3 style={headingStyle}>Allergies</h3>
        {values.allergies.map((row, i) => (
          <div key={i} style={rowStyle}>
            <input
              aria-label="Substance"
              placeholder="Substance *"
              value={row.substance}
              onChange={(e) => updateAllergy(i, "substance", e.target.value)}
            />
            <input
              aria-label="Reaction"
              placeholder="Reaction"
              value={row.reaction}
              onChange={(e) => updateAllergy(i, "reaction", e.target.value)}
            />
            <button type="button" onClick={() => removeAllergy(i)}>Remove</button>
          </div>
        ))}
        {errors.allergies && <p className="field-error">{errors.allergies}</p>}
        <button type="button" onClick={addAllergy}>Add allergy</button>
      </div>

      {/* Labs: one row per lab result */}
      <div>
        <h3 style={headingStyle}>Labs</h3>
        {values.labs.map((row, i) => (
          <div key={i} style={rowStyle}>
            <input
              aria-label="Test name"
              placeholder="Test *"
              value={row.testName}
              onChange={(e) => updateLab(i, "testName", e.target.value)}
            />
            <input
              aria-label="Result"
              placeholder="Result *"
              value={row.result}
              onChange={(e) => updateLab(i, "result", e.target.value)}
            />
            <input
              aria-label="Unit"
              placeholder="Unit"
              value={row.unit}
              onChange={(e) => updateLab(i, "unit", e.target.value)}
            />
            <select
              aria-label="Flag"
              value={row.flag}
              onChange={(e) => updateLab(i, "flag", e.target.value)}
            >
              <option value="">Flag</option>
              {FLAGS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <input
              type="datetime-local"
              aria-label="Collected at"
              value={row.collectedAt}
              onChange={(e) => updateLab(i, "collectedAt", e.target.value)}
            />
            <button type="button" onClick={() => removeLab(i)}>Remove</button>
          </div>
        ))}
        {errors.labs && <p className="field-error">{errors.labs}</p>}
        <button type="button" onClick={addLab}>Add lab</button>
      </div>
    </div>
  );
}
