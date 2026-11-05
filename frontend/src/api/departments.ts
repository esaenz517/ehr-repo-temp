import type { Department, Discipline } from "../types";
import { apiFetch } from "./client";

// Any signed-in person can list departments and disciplines (forms and filters
// need them). Creating and editing them is for admins.
export const departmentsApi = {
  list: () => apiFetch<Department[]>("/departments"),
  create: (input: { code: string; name: string }) =>
    apiFetch<Department>("/departments", { method: "POST", body: JSON.stringify(input) }),
  update: (departmentId: number, changes: { name?: string; is_active?: boolean }) =>
    apiFetch<Department>(`/departments/${departmentId}`, { method: "PATCH", body: JSON.stringify(changes) }),
};

export const disciplinesApi = {
  list: () => apiFetch<Discipline[]>("/disciplines"),
  create: (input: { code: string; name: string; department_id: number | null }) =>
    apiFetch<Discipline>("/disciplines", { method: "POST", body: JSON.stringify(input) }),
  update: (disciplineId: number, changes: { name?: string; department_id?: number | null; is_active?: boolean }) =>
    apiFetch<Discipline>(`/disciplines/${disciplineId}`, { method: "PATCH", body: JSON.stringify(changes) }),
};
