import type { Staff, StaffInput } from "../types";
import { apiFetch } from "./client";

export type CreateStaffInput = StaffInput;

// Partial update - only the fields included are changed on the backend.
// Discipline, department, and middle name can be cleared with null.
// The role is changed with setRole (needs the user.manage_roles permission).
export interface UpdateStaffInput {
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  discipline_id?: number | null;
  department_id?: number | null;
}

// Optional filters for the list
export interface StaffFilter {
  role?: string; // "ADMIN" | "FACULTY_INSTRUCTOR" | "STUDENT"
  department_id?: number;
}

export const staffApi = {
  list: (filter: StaffFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.role) params.set("role", filter.role);
    if (filter.department_id !== undefined) params.set("department_id", String(filter.department_id));
    const query = params.toString();
    return apiFetch<Staff[]>(query ? `/staff?${query}` : "/staff");
  },
  create: (input: CreateStaffInput) =>
    apiFetch<Staff>("/staff", { method: "POST", body: JSON.stringify(input) }),
  update: (staffId: number, changes: UpdateStaffInput) =>
    apiFetch<Staff>(`/staff/${staffId}`, { method: "PATCH", body: JSON.stringify(changes) }),
  setRole: (staffId: number, roleId: number) =>
    apiFetch<Staff>(`/staff/${staffId}/role/${roleId}`, { method: "PUT" }),
  remove: (staffId: number) => apiFetch<void>(`/staff/${staffId}`, { method: "DELETE" }),
};
