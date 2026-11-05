import type { Course, CourseTerm, Staff } from "../types";
import { apiFetch } from "./client";

// Shape of the data sent to the backend when creating a course.
export interface CreateCourseInput {
  subject_code: string;
  course_number: string;
  title: string;
  term: CourseTerm;
  term_year: number;
  department_id: number;
  is_active?: boolean;
}

// Partial update - only the fields included are changed on the backend.
export interface UpdateCourseInput {
  title?: string;
  department_id?: number;
  is_active?: boolean;
}

// One function per backend endpoint under /courses. Courses are never deleted;
// they're deactivated with update(id, { is_active: false }) so linked cases keep their history.
export const coursesApi = {
  // isActive undefined returns all courses; true/false returns active/deactivated only.
  list: (isActive?: boolean) =>
    apiFetch<Course[]>(isActive === undefined ? "/courses" : `/courses?is_active=${isActive}`),
  create: (input: CreateCourseInput) =>
    apiFetch<Course>("/courses", { method: "POST", body: JSON.stringify(input) }),
  update: (courseId: number, changes: UpdateCourseInput) =>
    apiFetch<Course>(`/courses/${courseId}`, { method: "PATCH", body: JSON.stringify(changes) }),

  // Courses the signed-in person teaches or is enrolled in (works for students too)
  mine: () => apiFetch<Course[]>("/courses/mine"),

  // Who is in a course: its students and the instructors who teach it
  enrollments: (courseId: number) => apiFetch<Staff[]>(`/courses/${courseId}/enrollments`),
  enroll: (courseId: number, staffId: number) =>
    apiFetch<void>(`/courses/${courseId}/enrollments/${staffId}`, { method: "POST" }),
  unenroll: (courseId: number, staffId: number) =>
    apiFetch<void>(`/courses/${courseId}/enrollments/${staffId}`, { method: "DELETE" }),
};
