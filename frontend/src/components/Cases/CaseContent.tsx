import { Field } from "../FormField";

// The values this section collects. The state itself lives in useCreateCase.
export interface CaseContentValues {
  chiefComplaint: string;
  narrative: string;
}

// Starting (blank) values for the form.
export const EMPTY_CASE_CONTENT: CaseContentValues = {
  chiefComplaint: "",
  narrative: "",
};

interface CaseContentProps {
  values: CaseContentValues;
  onChange: (field: keyof CaseContentValues, value: string) => void;
  errors: Partial<Record<keyof CaseContentValues, string>>;
}

// Case content section of the Create Case page: the chief complaint and the
// background story the student will see in the chart.
export function CaseContent({ values, onChange, errors }: CaseContentProps) {
  return (
    <div className="form-stack">
      <Field id="case-cc" label="Chief complaint" required error={errors.chiefComplaint}>
        <input
          id="case-cc"
          value={values.chiefComplaint}
          onChange={(e) => onChange("chiefComplaint", e.target.value)}
          required
        />
      </Field>

      <Field
        id="case-narrative"
        label="Case narrative / HPI seed"
        hint="Background the student sees in the chart. They write their own HPI."
      >
        <textarea
          id="case-narrative"
          rows={4}
          value={values.narrative}
          onChange={(e) => onChange("narrative", e.target.value)}
        />
      </Field>
    </div>
  );
}
