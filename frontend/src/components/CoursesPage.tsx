import { useState } from "react";
import { CourseForm, TERMS, YEARS } from "./Courses/CourseForm";
import { CourseList } from "./Courses/CourseList";
import { CourseFilter, useCourses } from "../hooks/useCourses";

const FILTERS: { value: CourseFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Deactivated" },
];

// Create, list, filter, rename, and deactivate/reactivate courses.
export function CoursesPage() {
  const { courses, filter, setFilter, loading, error, create, update, setActive } = useCourses();
  const [year, setYear] = useState("all"); // "all" or a year like "2026"
  const [term, setTerm] = useState("all"); // "all" or Fall / Spring / Summer

  // The usual year range plus any year an existing course uses, newest first
  const yearOptions = [...new Set([...YEARS, ...courses.map((c) => c.term_year)])].sort((a, b) => b - a);

  const shown = courses.filter(
    (c) => (year === "all" || c.term_year === Number(year)) && (term === "all" || c.term === term)
  );

  return (
    <div className="ui-page">
      <h1 className="ui-page-title">Courses</h1>

      <CourseForm onSubmit={create} />

      <div className="ui-toolbar">
        <label className="ui-filter">
          Show
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as CourseFilter)}
            className="ui-input"
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </label>

        <label className="ui-filter">
          Year
          <select value={year} onChange={(e) => setYear(e.target.value)} className="ui-input">
            <option value="all">All years</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>

        <label className="ui-filter">
          Semester
          <select value={term} onChange={(e) => setTerm(e.target.value)} className="ui-input">
            <option value="all">All semesters</option>
            {TERMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="ui-error">{error}</p>}
      {loading ? (
        <p className="ui-muted">Loading...</p>
      ) : (
        <CourseList
          courses={shown}
          onRename={(courseId, title) => update(courseId, { title })}
          onSetActive={setActive}
        />
      )}
    </div>
  );
}
