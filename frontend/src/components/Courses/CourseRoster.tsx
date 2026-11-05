import { useEffect, useState } from "react";
import { coursesApi } from "../../api/courses";
import { staffApi } from "../../api/staff";
import { roleName } from "../../access";
import type { Course, Staff } from "../../types";

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
  const [adding, setAdding] = useState(""); // staff id picked in the Add select
  const [loading, setLoading] = useState(true);
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

  const enroll = async () => {
    if (!adding) return;
    try {
      await coursesApi.enroll(course.course_id, Number(adding));
      setAdding("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to the course");
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
  // Students of the course's department first, then everyone else
  const candidates = everyone
    .filter((p) => !enrolled.has(p.staffid) && !p.admin)
    .sort(
      (a, b) =>
        Number(b.department_id === course.department_id) - Number(a.department_id === course.department_id) ||
        fullName(a).localeCompare(fullName(b))
    );

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

      {canEnroll && (
        <div className="courses-roster-add">
          <select
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            aria-label={`Person to add to ${course.short_label}`}
            className="ui-input"
          >
            <option value="">Add a student or instructor…</option>
            {candidates.map((p) => (
              <option key={p.staffid} value={p.staffid}>
                {fullName(p)} ({roleName(p.role_name)}{p.department_name ? `, ${p.department_name}` : ""})
              </option>
            ))}
          </select>
          <button type="button" className="ui-button ui-button--small" disabled={!adding} onClick={enroll}>
            Add
          </button>
        </div>
      )}

      {error && <p className="ui-error">{error}</p>}
    </section>
  );
}
