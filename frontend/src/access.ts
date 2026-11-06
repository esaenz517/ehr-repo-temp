// Who can see which page. Kept free of React so it can be unit-tested.
//
// Patients (portal accounts) see only the patient portal pages. Students see
// their own pages only. Everyone else sees a page when their role
// has the permission the page needs (the backend checks the same permissions on
// every request, so hiding a page is for convenience, not security).
import type { LoginResponse, RoleName } from "./types";

// All available pages in the application.
export type View =
  | "home"
  | "patients"
  | "staff"
  | "providers"
  | "rooms"
  | "courses"
  | "createCase"
  | "assignments"
  | "assignedCases"
  | "clinicalNotes"
  | "grades"
  | "progress"
  | "about"
  // Patient portal
  | "portalHome"
  | "portalAppointments"
  | "portalHistory"
  | "portalHealth"
  | "portalResults"
  | "portalBilling";

// Students can access their dashboard, assignments, and published grades.
export const STUDENT_VIEWS: View[] = ["home", "assignments", "grades"];

// Patients see their own record and nothing else. The backend enforces this too:
// patient accounts can only call /portal, which always returns their own data.
export const PATIENT_VIEWS: View[] = [
  "portalHome",
  "portalAppointments",
  "portalHistory",
  "portalHealth",
  "portalResults",
  "portalBilling",
];

// The permission each staff page needs.
export const VIEW_PERMISSIONS: Partial<Record<View, string>> = {
  createCase: "case.create",
  assignedCases: "assignment.manage",
  progress: "assignment.manage",
  patients: "patient.read",
  clinicalNotes: "note.read.general",
  providers: "provider.read",
  rooms: "room.read",
  staff: "staff.read",
  courses: "course.read",
};

export const ROLE_LABELS: Record<RoleName, string> = {
  ADMIN: "Administrator",
  FACULTY_INSTRUCTOR: "Instructor",
  STUDENT: "Student",
  PATIENT: "Patient",
};

// Label for a role name, e.g. "Instructor" for FACULTY_INSTRUCTOR.
export function roleName(role: string | null | undefined): string {
  if (!role) return "No role";
  return role in ROLE_LABELS ? ROLE_LABELS[role as RoleName] : role;
}

type Who = Pick<LoginResponse, "role" | "permissions">;

export function can(user: Who, permission: string): boolean {
  return user.permissions.includes(permission);
}

export function isStudent(user: Who): boolean {
  return user.role === "STUDENT";
}

export function isPatient(user: Pick<LoginResponse, "role">): boolean {
  return user.role === "PATIENT";
}

// The pages a person may open, in sidebar order.
export function viewsFor(user: Who): View[] {
  if (isPatient(user)) return [...PATIENT_VIEWS];
  if (isStudent(user)) return [...STUDENT_VIEWS];

  const views: View[] = ["home"];
  for (const [view, permission] of Object.entries(VIEW_PERMISSIONS) as [View, string][]) {
    if (can(user, permission)) views.push(view);
  }
  return views;
}

// Shown under the username, e.g. "Student · Nursing" or "Administrator".
export function roleLabel(user: Pick<LoginResponse, "role" | "department_name">): string {
  const role = roleName(user.role);
  return user.department_name ? `${role} · ${user.department_name}` : role;
}
