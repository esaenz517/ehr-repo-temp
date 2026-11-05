// Unit tests for the page-access rules in access.ts. Run with: npm test
import { describe, expect, it } from "vitest";
import { can, roleLabel, roleName, STUDENT_VIEWS, viewsFor } from "./access";
import type { LoginResponse } from "./types";

type Who = Pick<LoginResponse, "role" | "permissions" | "department_name">;

// Permission lists matching db/init/tables/RolePermissions.sql
const ADMIN: Who = {
  role: "ADMIN",
  department_name: null,
  permissions: [
    "appointment.read", "assignment.manage", "assignment.read", "case.create", "course.read",
    "note.read.general", "patient.read", "provider.read", "room.read", "staff.read", "user.manage_roles",
  ],
};
const INSTRUCTOR: Who = {
  role: "FACULTY_INSTRUCTOR",
  department_name: "Nursing",
  permissions: [
    "assignment.manage", "assignment.read", "case.create", "course.read", "note.read.general",
    "patient.read", "provider.read", "room.read", "staff.read",
  ],
};
const STUDENT: Who = {
  role: "STUDENT",
  department_name: "Pharmacy",
  permissions: ["assignment.read", "assignment.update", "case.read", "note.read.general", "patient.read"],
};

describe("viewsFor", () => {
  it("gives students only their own pages, even with read permissions", () => {
    expect(viewsFor(STUDENT)).toEqual(STUDENT_VIEWS);
    expect(viewsFor(STUDENT)).not.toContain("patients");
  });

  it("gives instructors the teaching and records pages", () => {
    const views = viewsFor(INSTRUCTOR);
    expect(views).toEqual(expect.arrayContaining([
      "home", "createCase", "assignedCases", "progress", "patients", "clinicalNotes", "staff", "courses",
    ]));
    expect(views).not.toContain("assignments");
    expect(views).not.toContain("grades");
  });

  it("hides a page when the permission is missing", () => {
    const noStaff = { ...INSTRUCTOR, permissions: INSTRUCTOR.permissions.filter((p) => p !== "staff.read") };
    expect(viewsFor(noStaff)).not.toContain("staff");
  });

  it("always includes the dashboard", () => {
    expect(viewsFor({ role: "FACULTY_INSTRUCTOR", permissions: [] })).toEqual(["home"]);
  });
});

describe("labels", () => {
  it("names roles", () => {
    expect(roleName("FACULTY_INSTRUCTOR")).toBe("Instructor");
    expect(roleName("ADMIN")).toBe("Administrator");
    expect(roleName(null)).toBe("No role");
    expect(roleName("SOMETHING_NEW")).toBe("SOMETHING_NEW");
  });

  it("adds the department when there is one", () => {
    expect(roleLabel(STUDENT)).toBe("Student · Pharmacy");
    expect(roleLabel(ADMIN)).toBe("Administrator");
  });
});

describe("can", () => {
  it("checks a permission code", () => {
    expect(can(ADMIN, "user.manage_roles")).toBe(true);
    expect(can(INSTRUCTOR, "user.manage_roles")).toBe(false);
  });
});
