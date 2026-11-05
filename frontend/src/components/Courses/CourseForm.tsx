import { FormEvent, useState } from "react";
import type { CreateCourseInput } from "../../api/courses";
import type { CourseTerm } from "../../types";

interface CourseFormProps {
  onSubmit: (input: CreateCourseInput) => Promise<boolean>;
  onCancel?: () => void; // shows a Cancel button that closes the form
}

export const TERMS: CourseTerm[] = ["Fall", "Spring", "Summer"];

// Years offered in the dropdowns: five back and five ahead of the current year
const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR - 5 + i);

// Form for creating a new course. Collects input and hands it up to onSubmit
// (CoursesPage wires this to useCourses().create). Only clears on success so
// a rejected course (e.g. a duplicate) can be corrected instead of retyped.
export function CourseForm({ onSubmit, onCancel }: CourseFormProps) {
  const [subjectCode, setSubjectCode] = useState("");
  const [courseNumber, setCourseNumber] = useState("");
  const [title, setTitle] = useState("");
  const [term, setTerm] = useState<CourseTerm>("Fall");
  const [termYear, setTermYear] = useState(CURRENT_YEAR);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // require every field before submitting (all are NOT NULL in the DB)
    if (!subjectCode.trim() || !courseNumber.trim() || !title.trim() || !termYear) return;
    const saved = await onSubmit({
      subject_code: subjectCode.trim().toUpperCase(),
      course_number: courseNumber.trim(),
      title: title.trim(),
      term,
      term_year: termYear,
    });
    if (saved) {
      setSubjectCode("");
      setCourseNumber("");
      setTitle("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ui-panel" aria-label="New course">
      <header className="ui-panel-header">
        <div className="ui-panel-heading">
          <h2 className="ui-panel-title">New course</h2>
          <p className="ui-panel-description">All fields are required.</p>
        </div>
      </header>

      <div className="ui-panel-body">
        <div className="form-grid courses-form-grid">
          <div className="form-field">
            <label htmlFor="course-subject">Subject</label>
            <input
              id="course-subject"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              placeholder="e.g. PHAR"
              maxLength={10}
              required
              className="ui-input"
            />
          </div>
          <div className="form-field">
            <label htmlFor="course-number">Number</label>
            <input
              id="course-number"
              value={courseNumber}
              onChange={(e) => setCourseNumber(e.target.value)}
              placeholder="e.g. 5310"
              maxLength={10}
              required
              className="ui-input"
            />
          </div>
          <div className="form-field courses-form-title">
            <label htmlFor="course-title">Title</label>
            <input
              id="course-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pharmacotherapy I"
              maxLength={200}
              required
              className="ui-input"
            />
          </div>
          <div className="form-field">
            <label htmlFor="course-term">Semester</label>
            <select
              id="course-term"
              value={term}
              onChange={(e) => setTerm(e.target.value as CourseTerm)}
              className="ui-input"
            >
              {TERMS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="course-year">Year</label>
            <select
              id="course-year"
              value={termYear}
              onChange={(e) => setTermYear(Number(e.target.value))}
              className="ui-input"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="ui-panel-footer">
        {onCancel && (
          <button type="button" className="ui-button ui-button--secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="ui-button">Add course</button>
      </div>
    </form>
  );
}
