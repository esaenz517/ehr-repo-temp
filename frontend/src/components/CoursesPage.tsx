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
    <div>
      <h1>Courses</h1>

      <CourseForm onSubmit={create} />

      <label style={{ display: "inline-flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        Show
        <select value={filter} onChange={(e) => setFilter(e.target.value as CourseFilter)}>
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </label>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? (
        <p>Loading...</p>
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
