import type { Permission, Role } from "../types";
import { apiFetch } from "./client";

export const rolesApi = {
    list: () => apiFetch<Role[]>("/roles"),

    get: (roleId: number) =>
        apiFetch<Role>(`/roles/${roleId}`),

    permissions: (roleId: number) =>
        apiFetch<Permission[]>(`/roles/${roleId}/permissions`),

    assignPermission: (roleId: number, permissionId: number) =>
        apiFetch<void>(
            `/roles/${roleId}/permissions/${permissionId}`,
            { method: "POST" }
        ),

    removePermission: (roleId: number, permissionId: number) =>
        apiFetch<void>(
            `/roles/${roleId}/permissions/${permissionId}`,
            { method: "DELETE" }
        ),
};