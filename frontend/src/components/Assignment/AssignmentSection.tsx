import { Field } from "../FormField";
import { useStaff } from "../../hooks/useStaff";
import "../Cases/cases.css";

//AI was used to assist in building this section as dev assigned to it is unfamiliar with how this works.

export type AssignmentType = "graded" | "practice";

// The values this section collects. The state itself lives in useCreateCase.
export interface AssignmentValues {
  course: string;
  dueDate: string; // local time from the input; converted to UTC on submit
  assignmentType: AssignmentType;
  studentIds: number[];
}

// Starting (blank) values for the form.
export const EMPTY_ASSIGNMENT: AssignmentValues = {
  course: "",
  dueDate: "",
  assignmentType: "graded",
  studentIds: [],
};

const MODES: { value: AssignmentType; label: string }[] = [
  { value: "graded", label: "Graded" },
  { value: "practice", label: "Practice" },
];

interface AssignmentSectionProps {
  values: AssignmentValues;
  onChange: <K extends keyof AssignmentValues>(field: K, value: AssignmentValues[K]) => void;
}

// Assignment section of the Create Case page: which students get the case,
// for which course, and by when. Optional: with no students checked, the case
// is created without assignments. New assignments always start as "not_started".
export function AssignmentSection({ values, onChange }: AssignmentSectionProps) {
  const { staff, loading } = useStaff();
  const students = staff.filter((s) => s.student);

  const toggleStudent = (id: number) =>
    onChange(
      "studentIds",
      values.studentIds.includes(id)
        ? values.studentIds.filter((x) => x !== id)
        : [...values.studentIds, id]
    );

  return (
    <div className="form-stack">
      <div className="form-grid">
        <Field id="assign-course" label="Course">
          <input
            id="assign-course"
            value={values.course}
            onChange={(e) => onChange("course", e.target.value)}
            placeholder="e.g. PHAR 5310"
          />
        </Field>

        <Field id="assign-due" label="Due date">
          <input
            id="assign-due"
            type="datetime-local"
            value={values.dueDate}
            onChange={(e) => onChange("dueDate", e.target.value)}
          />
        </Field>

        <div className="form-field">
          <span id="assign-mode-label" className="case-field-label">Mode</span>
          <div className="case-segmented" role="radiogroup" aria-labelledby="assign-mode-label">
            {MODES.map((mode) => (
              <label
                key={mode.value}
                className={`case-segmented-option${values.assignmentType === mode.value ? " case-segmented-option--selected" : ""}`}
              >
                <input
                  type="radio"
                  name="assign-mode"
                  value={mode.value}
                  checked={values.assignmentType === mode.value}
                  onChange={() => onChange("assignmentType", mode.value)}
                />
                {mode.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="form-field">
        <span className="case-field-label">Students</span>
        {loading ? (
          <p className="ui-muted">Loading...</p>
        ) : students.length === 0 ? (
          <p className="case-empty">No students found.</p>
        ) : (
          <div className="case-students">
            {students.map((s) => {
              const selected = values.studentIds.includes(s.staffid);
              return (
                <label key={s.staffid} className={`case-student${selected ? " case-student--selected" : ""}`}>
                  <input type="checkbox" checked={selected} onChange={() => toggleStudent(s.staffid)} />
                  {s.last_name}, {s.first_name}
                </label>
              );
            })}
          </div>
        )}
        <span className="field-hint">Leave empty to create the case without assigning it.</span>
      </div>
    </div>
  );
}
