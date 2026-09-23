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

export const staffApi = {
  list: () => apiFetch<Staff[]>("/staff"),
  create: (input: CreateStaffInput) =>
    apiFetch<Staff>("/staff", { method: "POST", body: JSON.stringify(input) }),
  remove: (staffId: number) => apiFetch<void>(`/staff/${staffId}`, { method: "DELETE" }),
};
