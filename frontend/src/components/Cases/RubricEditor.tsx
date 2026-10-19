import type { RubricCategory } from "../../types";

// Display names for the rubric categories (also used when scoring and in the student's grade).
export const RUBRIC_CATEGORY_LABELS: Record<RubricCategory, string> = {
  diagnosis: "Diagnosis",
  medication_conflict: "Medication conflict",
  screening: "Screening",
  trap: "Trap avoided",
  other: "Other",
};

// One rubric row in the form.
export interface RubricRow {
  category: RubricCategory;
  label: string;
  points: string; // the input's text; converted to a number when saving
  guidance: string;
}

// Blank row added by the "Add rubric item" button.
const EMPTY_ROW: RubricRow = { category: "diagnosis", label: "", points: "", guidance: "" };

// Points as a whole number above 0, or null when the text isn't one.
export function parsePoints(text: string): number | null {
  const n = Number(text);
  return text.trim() !== "" && Number.isInteger(n) && n > 0 ? n : null;
}

const rowStyle = { display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 8 };

interface RubricEditorProps {
  rows: RubricRow[];
  onChange: (rows: RubricRow[]) => void; // sends the whole updated list back up
  error?: string;
}

// Grading Rubric section of the Create Case page: the markers students are graded on.
// Every item awards points. Traps are written as the correct behavior, so "met" always means "did it right".
export function RubricEditor({ rows, onChange, error }: RubricEditorProps) {
  const update = (index: number, field: keyof RubricRow, value: string) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  const add = () => onChange([...rows, EMPTY_ROW]);
  const remove = (index: number) => onChange(rows.filter((_, i) => i !== index));

  const total = rows.reduce((sum, row) => sum + (parsePoints(row.points) ?? 0), 0);

  // Every button below is type="button" so it doesn't submit the whole form.
  return (
    <div className="form-stack">
      <p className="field-hint">
        Write traps as the correct behavior, e.g. "Avoided NSAIDs (patient on warfarin)". Students see each
        label and its points after you sign off; grading notes stay private to instructors.
      </p>

      {rows.map((row, i) => (
        <div key={i} style={rowStyle}>
          <select
            aria-label="Category"
            value={row.category}
            onChange={(e) => update(i, "category", e.target.value)}
          >
            {(Object.keys(RUBRIC_CATEGORY_LABELS) as RubricCategory[]).map((c) => (
              <option key={c} value={c}>{RUBRIC_CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <input
            aria-label="What the student should do"
            placeholder="What the student should do *"
            value={row.label}
            maxLength={300}
            onChange={(e) => update(i, "label", e.target.value)}
            style={{ flex: "2 1 240px" }}
          />
          <input
            aria-label="Points"
            placeholder="Points *"
            type="number"
            min={1}
            step={1}
            value={row.points}
            onChange={(e) => update(i, "points", e.target.value)}
            style={{ width: 90 }}
          />
          <input
            aria-label="Grading notes (instructors only)"
            placeholder="Grading notes (instructors only)"
            value={row.guidance}
            maxLength={1000}
            onChange={(e) => update(i, "guidance", e.target.value)}
            style={{ flex: "2 1 200px" }}
          />
          <button type="button" onClick={() => remove(i)}>Remove</button>
        </div>
      ))}

      {error && <p className="field-error">{error}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" onClick={add}>Add rubric item</button>
        {rows.length > 0 && <span className="field-hint">Total: {total} points</span>}
      </div>
    </div>
  );
}
