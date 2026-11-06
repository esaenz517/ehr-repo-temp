import { useEffect, useState } from "react";
import { coursesApi } from "../../api/courses";
import { staffApi } from "../../api/staff";
import type { Course, Staff } from "../../types";
import { CourseRosterAdd } from "./CourseRosterAdd";

interface CourseRosterProps {
  course: Course;
  canEnroll: boolean; // may add and remove people
}

const fullName = (p: Staff) => `${p.last_name}, ${p.first_name}`;

// Who is in a course offering: the instructors who teach it and its students.
// Only enrolled students can be assigned the course's cases.
export function CourseRoster({ course, canEnroll }: CourseRosterProps) {
  const [people, setPeople] = useState<Staff[]>([]);
  const [everyone, setEveryone] = useState<Staff[]>([]); // candidates to add
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false); // the Add people panel
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setPeople(await coursesApi.enrollments(course.course_id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the roster");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    if (canEnroll) staffApi.list().then(setEveryone).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.course_id, canEnroll]);

  // Adds everyone picked in CourseRosterAdd in one request; returns how many were added
  const enrollMany = async (staffIds: number[]) => {
    try {
      const { added } = await coursesApi.enrollMany(course.course_id, staffIds);
      await load();
      return added;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to the course");
      return null;
    }
  };

  const unenroll = async (person: Staff) => {
    try {
      await coursesApi.unenroll(course.course_id, person.staffid);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove from the course");
    }
  };

  const enrolled = new Set(people.map((p) => p.staffid));
  // Everyone not yet in the course except admins, sorted by name
  const candidates = everyone
    .filter((p) => !enrolled.has(p.staffid) && !p.admin)
    .sort((a, b) => fullName(a).localeCompare(fullName(b)));

  const instructors = people.filter((p) => !p.student);
  const students = people.filter((p) => p.student);

  const group = (title: string, rows: Staff[]) => (
    <div className="courses-roster-group">
      <h3 className="courses-roster-title">
        {title} <span className="ui-muted">({rows.length})</span>
      </h3>
      {rows.length === 0 ? (
        <p className="ui-muted">None yet.</p>
      ) : (
        <ul className="courses-roster-list">
          {rows.map((p) => (
            <li key={p.staffid} className="courses-roster-person">
              <span>
                {fullName(p)}
                {p.discipline_name && <span className="ui-muted"> · {p.discipline_name}</span>}
              </span>
              {canEnroll && (
                <button
                  type="button"
                  className="ui-button ui-button--secondary ui-button--small"
                  onClick={() => unenroll(p)}
                  aria-label={`Remove ${p.first_name} ${p.last_name} from ${course.short_label}`}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <section className="courses-roster" aria-label={`Roster for ${course.short_label}`}>
      {loading ? (
        <p className="ui-muted">Loading roster…</p>
      ) : (
        <div className="courses-roster-groups">
          {group("Instructors", instructors)}
          {group("Students", students)}
        </div>
      )}

      {canEnroll &&
        (pickerOpen ? (
          <CourseRosterAdd
            course={course}
            candidates={candidates}
            onAdd={enrollMany}
            onClose={() => setPickerOpen(false)}
          />
        ) : (
          <div className="courses-roster-toolbar">
            <button type="button" className="ui-button ui-button--small" onClick={() => setPickerOpen(true)}>
              + Add people
            </button>
          </div>
        ))}

      {error && <p className="ui-error">{error}</p>}
    </section>
  );
}
