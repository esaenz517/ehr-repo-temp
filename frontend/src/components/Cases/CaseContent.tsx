import { Field } from "../FormField";
import { useNoteTemplates } from "../../hooks/useNoteTemplates";
import { ANY_DISCIPLINE, type NoteTemplate } from "../../api/noteTemplates";

// The values this section collects. The state itself lives in useCreateCase.
export interface CaseContentValues {
  chiefComplaint: string;
  narrative: string;
  // The note template students write for this case
  noteType: string;
}

// Starting (blank) values for the form.
export const EMPTY_CASE_CONTENT: CaseContentValues = {
  chiefComplaint: "",
  narrative: "",
  noteType: "SOAP",
};

interface CaseContentProps {
  values: CaseContentValues;
  onChange: (field: keyof CaseContentValues, value: string) => void;
  errors: Partial<Record<keyof CaseContentValues, string>>;
}

// Case content section of the Create Case page: the chief complaint and the
// background story the student will see in the chart.
export function CaseContent({ values, onChange, errors }: CaseContentProps) {
  const { templates } = useNoteTemplates();
  const chosen = templates.find((t) => t.id === values.noteType) as NoteTemplate | undefined;
  return (
    <div className="form-stack">

<Field
        id="case-note-type"
        label="Note students write"
        hint={
          !chosen?.author_disciplines?.length
            ? "The template students fill in for this case."
            : chosen.author_disciplines.includes(ANY_DISCIPLINE)
              ? "Any student with a discipline can be assigned this case."
              : "Only students in this note's discipline can be assigned this case."
        }
      >
        <select
          id="case-note-type"
          value={values.noteType}
          onChange={(e) => onChange("noteType", e.target.value)}
        >
          {templates
            .filter((t) => t.enabled)
            .map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
        </select>
      </Field>

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
