import { useCallback, useEffect, useState } from "react";
import { coursesApi, CreateCourseInput, UpdateCourseInput } from "../api/courses";
import type { Course } from "../types";

export type CourseFilter = "all" | "active" | "inactive";

// Maps the page's filter to the backend's is_active query param.
const FILTER_PARAM: Record<CourseFilter, boolean | undefined> = {
  all: undefined,
  active: true,
  inactive: false,
};

// apiFetch only reports the status code, so translate the ones the courses API
// uses on purpose into messages a user can act on.
function errorMessage(err: unknown, fallback: string) {
  const message = err instanceof Error ? err.message : "";
  if (message.includes("409")) return "That course already exists for that term.";
  if (message.includes("422")) return "Some course fields are invalid. Check the values and try again.";
  if (message.includes("404")) return "That course no longer exists.";
  return message || fallback;
}

// All the state + actions CoursesPage needs. Keeps data-fetching out of the components.
export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState<CourseFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetches courses for the current filter. Re-created (and so re-run by the
  // effect below) whenever the filter changes.
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setCourses(await coursesApi.list(FILTER_PARAM[filter]));
      setError(null);
    } catch (err) {
      setError(errorMessage(err, "Failed to load courses"));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  // Returns true on success so the form knows whether to clear its inputs.
  const create = async (input: CreateCourseInput) => {
    try {
      await coursesApi.create(input);
      await load(); // refresh so the new course shows up in the list
      return true;
    } catch (err) {
      setError(errorMessage(err, "Failed to create course"));
      return false;
    }
  };

  const update = async (courseId: number, changes: UpdateCourseInput) => {
    try {
      await coursesApi.update(courseId, changes);
      await load(); // a deactivated course may drop out of the current filter
      return true;
    } catch (err) {
      setError(errorMessage(err, "Failed to update course"));
      return false;
    }
  };

  const setActive = (courseId: number, isActive: boolean) =>
    update(courseId, { is_active: isActive });

  return { courses, filter, setFilter, loading, error, create, update, setActive };
}
