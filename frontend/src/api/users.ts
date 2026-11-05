import type { User } from "../types";
import { apiFetch } from "./client";

// Accounts only (email + password). A person's role is on their Staff row:
// see staffApi.setRole.
export interface CreateUserInput {
    email: string;
    password: string;
}

export const usersApi = {
    list: () => apiFetch<User[]>("/users"),

    get: (userId: number) =>
        apiFetch<User>(`/users/${userId}`),

    create: (input: CreateUserInput) =>
        apiFetch<User>("/users", {
            method: "POST",
            body: JSON.stringify(input),
        }),

    setStatus: (userId: number, accountStatus: User["account_status"]) =>
        apiFetch<User>(`/users/${userId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ account_status: accountStatus }),
        }),
};
