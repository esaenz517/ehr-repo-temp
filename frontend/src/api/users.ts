import type { Role, User } from "../types";
import { apiFetch } from "./client";

export interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    discipline: string | null;
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

    roles: (userId: number) =>
        apiFetch<Role[]>(`/users/${userId}/roles`),

    assignRole: (userId: number, roleId: number) =>
        apiFetch<void>(
            `/users/${userId}/roles/${roleId}`,
            { method: "POST" }
        ),

    removeRole: (userId: number, roleId: number) =>
        apiFetch<void>(
            `/users/${userId}/roles/${roleId}`,
            { method: "DELETE" }
        ),
};