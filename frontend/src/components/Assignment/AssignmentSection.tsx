import { useEffect, useState } from "react";
import { Field } from "../FormField";
import { coursesApi } from "../../api/courses";
import { staffApi } from "../../api/staff";
import type { Course, Staff } from "../../types";
import "../Cases/cases.css";

//AI was used to assist in building this section as dev assigned to it is unfamiliar with how this works.

export type AssignmentType = "graded" | "practice";

// The values this section collects. The state itself lives in useCreateCase.
export interface AssignmentValues {
  courseId: string; // "" = no course
  dueDate: string; // local time from the input; converted to UTC on submit
  assignmentType: AssignmentType;
  studentIds: number[];
}

// Starting (blank) values for the form.
export const EMPTY_ASSIGNMENT: AssignmentValues = {
  courseId: "",
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
// Picking a course narrows the student list to the students enrolled in it
// (the backend only accepts enrolled students for a course).
export function AssignmentSection({ values, onChange }: AssignmentSectionProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [taught, setTaught] = useState<Set<number>>(new Set()); // courses the instructor teaches
  const [students, setStudents] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active courses; the ones this instructor teaches are listed first
  useEffect(() => {
    let live = true;
    Promise.all([coursesApi.list(true), coursesApi.mine().catch(() => [] as Course[])])
      .then(([all, mine]) => {
        if (!live) return;
        setCourses(all);
        setTaught(new Set(mine.map((c) => c.course_id)));
      })
      .catch((err: Error) => live && setError(err.message));
    return () => {
      live = false;
    };
  }, []);

  // Students: everyone, or only those enrolled in the chosen course
  const { courseId } = values;
  useEffect(() => {
    let live = true;
    setLoading(true);
    const load = courseId
      ? coursesApi.enrollments(Number(courseId)).then((people) => people.filter((p) => p.student))
      : staffApi.list({ role: "STUDENT" });
    load
      .then((rows) => {
        if (!live) return;
        setStudents(rows);
        setError(null);
      })
      .catch((err: Error) => live && setError(err.message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [courseId]);

  // Changing the course drops checked students who aren't in it
  const chooseCourse = (value: string) => {
    onChange("courseId", value);
    if (!value) return;
    coursesApi
      .enrollments(Number(value))
      .then((people) => {
        const enrolled = new Set(people.map((p) => p.staffid));
        const kept = values.studentIds.filter((id) => enrolled.has(id));
        if (kept.length !== values.studentIds.length) onChange("studentIds", kept);
      })
      .catch(() => {});
  };

  const toggleStudent = (id: number) =>
    onChange(
      "studentIds",
      values.studentIds.includes(id)
        ? values.studentIds.filter((x) => x !== id)
        : [...values.studentIds, id]
    );

  const mine = courses.filter((c) => taught.has(c.course_id));
  const others = courses.filter((c) => !taught.has(c.course_id));
  const option = (c: Course) => (
    <option key={c.course_id} value={c.course_id}>{c.label}</option>
  );

  return (
    <div className="form-stack">
      <div className="form-grid">
        <Field id="assign-course" label="Course">
          <select
            id="assign-course"
            value={values.courseId}
            onChange={(e) => chooseCourse(e.target.value)}
          >
            <option value="">No course</option>
            {mine.length > 0 && <optgroup label="Courses you teach">{mine.map(option)}</optgroup>}
            {others.length > 0 && (
              mine.length > 0 ? <optgroup label="Other active courses">{others.map(option)}</optgroup> : others.map(option)
            )}
          </select>
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
        {error ? (
          <p className="ui-error">{error}</p>
        ) : loading ? (
          <p className="ui-muted">Loading...</p>
        ) : students.length === 0 ? (
          <p className="case-empty">{values.courseId ? "No students are enrolled in this course." : "No students found."}</p>
        ) : (
          <div className="case-students">
            {students.map((s) => {
              const selected = values.studentIds.includes(s.staffid);
              return (
                <label key={s.staffid} className={`case-student${selected ? " case-student--selected" : ""}`}>
                  <input type="checkbox" checked={selected} onChange={() => toggleStudent(s.staffid)} />
                  {s.last_name}, {s.first_name}
                  {s.department_name && <span className="case-student-meta">{s.department_name}</span>}
                </label>
              );
            })}
          </div>
        )}
        <span className="field-hint">
          {values.courseId
            ? "Only students enrolled in the course are listed."
            : "Leave empty to create the case without assigning it."}
        </span>
      </div>
    </div>
  );
}
