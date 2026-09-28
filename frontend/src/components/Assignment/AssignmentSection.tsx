import { Field } from "../FormField";
import { useStaff } from "../../hooks/useStaff";

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

        <Field id="assign-mode" label="Mode">
          <select
            id="assign-mode"
            value={values.assignmentType}
            onChange={(e) => onChange("assignmentType", e.target.value as AssignmentType)}
          >
            <option value="graded">Graded</option>
            <option value="practice">Practice</option>
          </select>
        </Field>
      </div>

      <div className="form-field">
        <label>Students</label>
        {loading ? (
          <p>Loading...</p>
        ) : students.length === 0 ? (
          <p style={{ color: "#888" }}>No students found.</p>
        ) : (
          students.map((s) => (
            <label key={s.staffid} style={{ fontWeight: 400 }}>
              <input
                type="checkbox"
                checked={values.studentIds.includes(s.staffid)}
                onChange={() => toggleStudent(s.staffid)}
              />{" "}
              {s.last_name}, {s.first_name}
            </label>
          ))
        )}
        <span className="field-hint">Leave empty to create the case without assigning it.</span>
      </div>
    </div>
  );
}
