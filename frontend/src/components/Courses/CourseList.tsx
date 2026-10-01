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
    return <p style={{ color: "#555" }}>No courses match this filter.</p>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {courses.map((course) => (
        <li
          key={course.course_id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            padding: "8px 0",
            borderBottom: "1px solid #eee",
            opacity: course.is_active ? 1 : 0.6,
          }}
        >
          <div style={{ flex: 1 }}>
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
                style={{ width: "100%" }}
              />
            ) : (
              <strong>{course.label}</strong>
            )}
            <div style={{ fontSize: 14, color: "#555" }}>
              Status: {course.is_active ? "Active" : "Deactivated"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {editingId === course.course_id ? (
              <>
                <button onClick={() => saveEdit(course.course_id)}>Save</button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <button onClick={() => startEdit(course)}>Edit title</button>
            )}
            <button onClick={() => onSetActive(course.course_id, !course.is_active)}>
              {course.is_active ? "Deactivate" : "Reactivate"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
