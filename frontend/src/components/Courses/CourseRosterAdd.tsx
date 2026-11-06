import { useMemo, useState } from "react";
import { roleName } from "../../access";
import type { Course, Staff } from "../../types";

interface CourseRosterAddProps {
  course: Course;
  candidates: Staff[]; // people not yet in the course (admins already left out)
  onAdd: (staffIds: number[]) => Promise<number | null>; // how many were added, null on failure
  onClose: () => void;
}

type RoleFilter = "students" | "instructors" | "everyone";

const ALL_DEPARTMENTS = "all";

const fullName = (p: Staff) => `${p.last_name}, ${p.first_name}`;

// What a person is shown as under their name: a student's discipline, otherwise their role
const describe = (p: Staff) =>
  [p.student ? p.discipline_name ?? "Student" : roleName(p.role_name), p.department_name].filter(Boolean).join(" · ");

// Panel for adding several people to a course at once. The left side finds people
// (role, department, name), the right side lists who is picked so far; picks
// survive filter changes, so you can build one list across departments.
export function CourseRosterAdd({ course, candidates, onAdd, onClose }: CourseRosterAddProps) {
  const [role, setRole] = useState<RoleFilter>("students");
  const [department, setDepartment] = useState<string>(
    course.department_id ? String(course.department_id) : ALL_DEPARTMENTS
  );
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Departments the candidates belong to, for the filter dropdown
  const departments = useMemo(() => {
    const byId = new Map<number, string>();
    for (const p of candidates) {
      if (p.department_id !== null) byId.set(p.department_id, p.department_name ?? `Department ${p.department_id}`);
    }
    if (course.department_id && !byId.has(course.department_id)) {
      byId.set(course.department_id, course.department_name ?? `Department ${course.department_id}`);
    }
    return [...byId].sort((a, b) => a[1].localeCompare(b[1]));
  }, [candidates, course.department_id, course.department_name]);

  const term = search.trim().toLowerCase();
  const shown = candidates
    .filter((p) => role === "everyone" || (role === "students" ? p.student : !p.student))
    .filter((p) => department === ALL_DEPARTMENTS || String(p.department_id) === department)
    .filter((p) => !term || `${p.first_name} ${p.last_name}`.toLowerCase().includes(term));

  // Picked people still waiting to be added (someone may have been enrolled meanwhile)
  const picked = candidates.filter((p) => selected.has(p.staffid));
  const shownPicked = shown.filter((p) => selected.has(p.staffid)).length;
  const allShownPicked = shown.length > 0 && shownPicked === shown.length;
  const filtersNarrowing = role !== "students" || department !== ALL_DEPARTMENTS || term !== "";

  const toggle = (staffId: number) => {
    setNotice(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  };

  // Select all picks everyone currently shown; unticking clears just those
  const toggleAllShown = () => {
    setNotice(null);
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of shown) {
        if (allShownPicked) next.delete(p.staffid);
        else next.add(p.staffid);
      }
      return next;
    });
  };

  const add = async () => {
    if (picked.length === 0) return;
    setSaving(true);
    const added = await onAdd(picked.map((p) => p.staffid));
    setSaving(false);
    if (added !== null) {
      setSelected(new Set());
      setNotice(`Added ${added} ${added === 1 ? "person" : "people"} to ${course.short_label}.`);
    }
  };

  const showAllDepartments = () => {
    setDepartment(ALL_DEPARTMENTS);
    setSearch("");
  };

  return (
    <section
      className="ui-panel courses-add"
      aria-label={`Add people to ${course.short_label}`}
    >
      <header className="courses-add-header">
        <div>
          <h3 className="courses-add-title">Add people to {course.short_label}</h3>
          <p className="ui-muted courses-add-subtitle">
            Pick as many as you need, from any department, then add them all at once.
          </p>
        </div>
        <button type="button" className="ui-button ui-button--ghost ui-button--small" onClick={onClose}>
          Done
        </button>
      </header>

      <div className="ui-filter-bar courses-add-filters">
        <label className={`ui-filter-field${role !== "students" ? " ui-filter-field--active" : ""}`}>
          <span className="ui-filter-label">Show</span>
          <select value={role} onChange={(e) => setRole(e.target.value as RoleFilter)} className="ui-input">
            <option value="students">Students</option>
            <option value="instructors">Instructors</option>
            <option value="everyone">Everyone</option>
          </select>
        </label>
        <label className={`ui-filter-field${department !== ALL_DEPARTMENTS ? " ui-filter-field--active" : ""}`}>
          <span className="ui-filter-label">Department</span>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className="ui-input">
            <option value={ALL_DEPARTMENTS}>All departments</option>
            {departments.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className={`ui-filter-field courses-add-search${term ? " ui-filter-field--active" : ""}`}>
          <span className="ui-filter-label">Name</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="ui-input"
            autoFocus
          />
        </label>
        <div className="ui-filter-summary">
          <span>
            <strong>{shown.length}</strong> available
          </span>
        </div>
      </div>

      <div className="courses-add-body">
        {/* Left: people matching the filters */}
        <div className="courses-add-results">
          {shown.length === 0 ? (
            <div className="courses-add-empty">
              <p>No one left to add matches these filters.</p>
              {filtersNarrowing && department !== ALL_DEPARTMENTS && (
                <button type="button" className="ui-button ui-button--secondary ui-button--small" onClick={showAllDepartments}>
                  Show all departments
                </button>
              )}
            </div>
          ) : (
            <>
              <label className="courses-add-all">
                <input
                  type="checkbox"
                  checked={allShownPicked}
                  ref={(el) => {
                    if (el) el.indeterminate = shownPicked > 0 && !allShownPicked;
                  }}
                  onChange={toggleAllShown}
                />
                Select all {shown.length} shown
              </label>
              <ul className="courses-add-list">
                {shown.map((p) => {
                  const isPicked = selected.has(p.staffid);
                  return (
                    <li key={p.staffid}>
                      <label className={`courses-add-person${isPicked ? " courses-add-person--picked" : ""}`}>
                        <input type="checkbox" checked={isPicked} onChange={() => toggle(p.staffid)} />
                        <span className="courses-add-name">
                          <span>{fullName(p)}</span>
                          <span className="ui-muted courses-add-meta">{describe(p)}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {/* Right: everyone picked so far, across filters */}
        <aside className="courses-add-picked" aria-label="Selected people">
          <h4 className="courses-add-picked-title">
            Selected <span className="ui-badge">{picked.length}</span>
          </h4>

          {picked.length === 0 ? (
            <p className="ui-muted courses-add-picked-empty">Tick people on the left to add them here.</p>
          ) : (
            <ul className="courses-add-chips">
              {picked.map((p) => (
                <li key={p.staffid}>
                  <button
                    type="button"
                    className="courses-add-chip"
                    onClick={() => toggle(p.staffid)}
                    aria-label={`Remove ${p.first_name} ${p.last_name} from the selection`}
                  >
                    {p.first_name} {p.last_name}
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {notice && (
            <p className="ui-alert ui-alert--success" role="status">
              {notice}
            </p>
          )}

          <div className="courses-add-actions">
            <button type="button" className="ui-button" disabled={picked.length === 0 || saving} onClick={add}>
              {saving ? "Adding…" : picked.length === 0 ? "Add to course" : `Add ${picked.length} to ${course.short_label}`}
            </button>
            {picked.length > 0 && (
              <button
                type="button"
                className="ui-button ui-button--secondary"
                disabled={saving}
                onClick={() => setSelected(new Set())}
              >
                Clear
              </button>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
