import { useEffect, useState } from "react";
import { departmentsApi, disciplinesApi } from "../api/departments";
import { rolesApi } from "../api/roles";
import type { Department, Discipline, Role } from "../types";

// Departments, disciplines, and roles for selects and filters.
// Roles need the role.read permission; without it the list stays empty.
export function useReferenceData({ withRoles = false } = {}) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    let live = true;
    departmentsApi.list().then((rows) => live && setDepartments(rows)).catch(() => {});
    disciplinesApi.list().then((rows) => live && setDisciplines(rows)).catch(() => {});
    if (withRoles) {
      rolesApi.list().then((rows) => live && setRoles(rows.filter((r) => r.is_active))).catch(() => {});
    }
    return () => {
      live = false;
    };
  }, [withRoles]);

  return {
    departments: departments.filter((d) => d.is_active),
    disciplines: disciplines.filter((d) => d.is_active),
    roles,
  };
}
