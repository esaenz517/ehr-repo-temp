import { FormEvent, useState } from "react";
import type { CreateCourseInput } from "../../api/courses";
import type { CourseTerm } from "../../types";

interface CourseFormProps {
  onSubmit: (input: CreateCourseInput) => Promise<boolean>;
}

const TERMS: CourseTerm[] = ["Fall", "Spring", "Summer"];

// Form for creating a new course. Collects input and hands it up to onSubmit
// (CoursesPage wires this to useCourses().create). Only clears on success so
// a rejected course (e.g. a duplicate) can be corrected instead of retyped.
export function CourseForm({ onSubmit }: CourseFormProps) {
  const [subjectCode, setSubjectCode] = useState("");
  const [courseNumber, setCourseNumber] = useState("");
  const [title, setTitle] = useState("");
  const [term, setTerm] = useState<CourseTerm>("Fall");
  const [termYear, setTermYear] = useState(String(new Date().getFullYear()));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // require every field before submitting (all are NOT NULL in the DB)
    if (!subjectCode.trim() || !courseNumber.trim() || !title.trim() || !termYear) return;
    const saved = await onSubmit({
      subject_code: subjectCode.trim().toUpperCase(),
      course_number: courseNumber.trim(),
      title: title.trim(),
      term,
      term_year: Number(termYear),
    });
    if (saved) {
      setSubjectCode("");
      setCourseNumber("");
      setTitle("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ui-form-bar">
      <input
        value={subjectCode}
        onChange={(e) => setSubjectCode(e.target.value)}
        placeholder="Subject (e.g. PHAR)"
        aria-label="Subject code"
        maxLength={10}
        className="ui-input"
      />
      <input
        value={courseNumber}
        onChange={(e) => setCourseNumber(e.target.value)}
        placeholder="Number (e.g. 5310)"
        aria-label="Course number"
        maxLength={10}
        className="ui-input"
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Course title"
        aria-label="Course title"
        maxLength={200}
        className="ui-input ui-input--wide"
      />
      <select
        value={term}
        onChange={(e) => setTerm(e.target.value as CourseTerm)}
        aria-label="Term"
        className="ui-input ui-input--narrow"
      >
        {TERMS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <input
        value={termYear}
        onChange={(e) => setTermYear(e.target.value)}
        type="number"
        min={2000}
        max={2100}
        aria-label="Term year"
        className="ui-input ui-input--narrow"
      />
      <button type="submit" className="ui-button">Add course</button>
    </form>
  );
}
