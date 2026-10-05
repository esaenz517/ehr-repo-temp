import { CourseForm } from "./Courses/CourseForm";
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

  return (
    <div className="ui-page">
      <h1 className="ui-page-title">Courses</h1>

      <CourseForm onSubmit={create} />

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

      {error && <p className="ui-error">{error}</p>}
      {loading ? (
        <p className="ui-muted">Loading...</p>
      ) : (
        <CourseList
          courses={courses}
          onRename={(courseId, title) => update(courseId, { title })}
          onSetActive={setActive}
        />
      )}
    </div>
  );
}
