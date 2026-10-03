import { useState } from "react";
import type { Course } from "../../types";

interface CourseListProps {
  courses: Course[];
  onRename: (courseId: number, title: string) => Promise<boolean>;
  onSetActive: (courseId: number, isActive: boolean) => void;
}

// Displays every course with its status. Each row can rename the course title
// inline and deactivate/reactivate it (courses are never deleted).
export function CourseList({ courses, onRename, onSetActive }: CourseListProps) {
  // Only one course is edited at a time: its id and the draft title.
  const [editingId, setEditingId] = useState<number | null>(null);
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
    <ul className="ui-row-list">
      {courses.map((course) => (
        <li
          key={course.course_id}
          className={course.is_active ? "ui-row" : "ui-row ui-row--inactive"}
        >
          <div className="ui-row-main">
            {editingId === course.course_id ? (
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
              <div className="ui-row-title">{course.label}</div>
            )}
            <div className="ui-row-subtitle">
              Status: {course.is_active ? "Active" : "Deactivated"}
            </div>
          </div>

          <div className="ui-row-actions">
            {editingId === course.course_id ? (
              <>
                <button className="ui-button" onClick={() => saveEdit(course.course_id)}>
                  Save
                </button>
                <button className="ui-button ui-button--secondary" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="ui-button ui-button--secondary" onClick={() => startEdit(course)}>
                Edit title
              </button>
            )}
            <button
              className={course.is_active ? "ui-button ui-button--danger" : "ui-button"}
              onClick={() => onSetActive(course.course_id, !course.is_active)}
            >
              {course.is_active ? "Deactivate" : "Reactivate"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
