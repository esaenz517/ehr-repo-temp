import type { Staff } from "../types";
import { apiFetch } from "./client";

export interface CreateStaffInput {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  specialization: string;
  student: boolean;
  admin: boolean;
}

// Partial update - only the fields included are changed on the backend.
// The student flag can't be changed here.
export interface UpdateStaffInput {
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  specialization?: string;
  admin?: boolean;
}

export const staffApi = {
  list: () => apiFetch<Staff[]>("/staff"),
  create: (input: CreateStaffInput) =>
    apiFetch<Staff>("/staff", { method: "POST", body: JSON.stringify(input) }),
  update: (staffId: number, changes: UpdateStaffInput) =>
    apiFetch<Staff>(`/staff/${staffId}`, { method: "PATCH", body: JSON.stringify(changes) }),
  remove: (staffId: number) => apiFetch<void>(`/staff/${staffId}`, { method: "DELETE" }),
};
