import { Fragment, useState } from "react";
import type { Course, CourseTerm } from "../../types";
import { CourseRoster } from "./CourseRoster";
import "./courses.css";

interface CourseListProps {
  courses: Course[];
  canEnroll: boolean; // may add and remove people (course.update)
  onRename: (courseId: number, title: string) => Promise<boolean>;
  onSetActive: (courseId: number, isActive: boolean) => void;
}

// Later terms in a year sort first (Fall, then Summer, then Spring)
const TERM_ORDER: Record<CourseTerm, number> = { Fall: 0, Summer: 1, Spring: 2 };

// Active courses first, then newest semester, then by subject and course number
const byActiveThenNewestSemester = (a: Course, b: Course) =>
  Number(b.is_active) - Number(a.is_active) ||
  b.term_year - a.term_year ||
  TERM_ORDER[a.term] - TERM_ORDER[b.term] ||
  a.subject_code.localeCompare(b.subject_code) ||
  a.course_number.localeCompare(b.course_number, undefined, { numeric: true });

// Displays every course as a table row: course, title, department, year, semester, status.
// Each row can rename the course title inline, deactivate/reactivate it (courses are
// never deleted), and open its roster of enrolled students and instructors.
export function CourseList({ courses, canEnroll, onRename, onSetActive }: CourseListProps) {
  // Only one course is edited at a time: its id and the draft title.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [rosterId, setRosterId] = useState<number | null>(null); // the course whose roster is open
  const [draftTitle, setDraftTitle] = useState("");

  const startEdit = (course: Course) => {
    setEditingId(course.course_id);
    setDraftTitle(course.title);
  };

  const saveEdit = async (courseId: number) => {
    if (!draftTitle.trim()) return;
    if (await onRename(courseId, draftTitle.trim())) setEditingId(null);
  };

  if (courses.length === 0) {
    return <p className="ui-row-empty">No courses match this filter.</p>;
  }

  return (
    <div className="ui-table-card ui-table-wrap">
      <table className="ui-table courses-table">
        <thead>
          <tr>
            <th>Course</th>
            <th>Title</th>
            <th>Department</th>
            <th>Year</th>
            <th>Semester</th>
            <th>Status</th>
            <th><span className="ui-visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {[...courses].sort(byActiveThenNewestSemester).map((course) => {
            const editing = editingId === course.course_id;
            const rosterOpen = rosterId === course.course_id;
            return (
              <Fragment key={course.course_id}>
              <tr className={course.is_active ? "courses-row" : "courses-row courses-row--inactive"}>
                <td className="courses-code">{course.short_label}</td>
                <td className="courses-title">
                  {editing ? (
                    <input
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(course.course_id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      aria-label={`Title for ${course.short_label}`}
                      maxLength={200}
                      autoFocus
                      className="ui-input ui-input--full"
                    />
                  ) : (
                    course.title
                  )}
                </td>
                <td className="courses-department">{course.department_name ?? "—"}</td>
                <td className="courses-year">{course.term_year}</td>
                <td className="courses-semester">{course.term}</td>
                <td className="courses-status">
                  <span className={`ui-badge ${course.is_active ? "ui-badge--success" : "ui-badge--muted"}`}>
                    {course.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="courses-actions">
                  <div className="ui-row-actions">
                    {editing ? (
                      <>
                        <button className="ui-button ui-button--small" onClick={() => saveEdit(course.course_id)}>
                          Save
                        </button>
                        <button
                          className="ui-button ui-button--secondary ui-button--small"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="ui-button ui-button--secondary ui-button--small"
                        onClick={() => startEdit(course)}
                      >
                        Edit title
                      </button>
                    )}
                    <button
                      className="ui-button ui-button--secondary ui-button--small"
                      aria-expanded={rosterOpen}
                      onClick={() => setRosterId(rosterOpen ? null : course.course_id)}
                    >
                      {rosterOpen ? "Hide roster" : "Roster"}
                    </button>
                    <button
                      className={`ui-button ui-button--small${course.is_active ? " ui-button--danger" : ""}`}
                      onClick={() => onSetActive(course.course_id, !course.is_active)}
                    >
                      {course.is_active ? "Deactivate" : "Reactivate"}
                    </button>
                  </div>
                </td>
              </tr>
              {rosterOpen && (
                <tr className="courses-roster-row">
                  <td colSpan={7}>
                    <CourseRoster course={course} canEnroll={canEnroll} />
                  </td>
                </tr>
              )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
