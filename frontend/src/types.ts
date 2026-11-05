// The three roles. Every person (Staff) has exactly one.
export type RoleName = "ADMIN" | "FACULTY_INSTRUCTOR" | "STUDENT";

export interface Role {
  role_id: number;
  role_name: RoleName | string;
  display_name: string;
  is_active: boolean;
}

// Academic department (Nursing, Pharmacy, ...). People and courses belong to one.
export interface Department {
  department_id: number;
  code: string; // e.g. "NURS"
  name: string;
  is_active: boolean;
}

// The kind of clinician a person acts as in a chart (Nursing, Pharmacy, ...).
export interface Discipline {
  discipline_id: number;
  code: string; // e.g. "NURSE"
  name: string;
  department_id: number | null;
  is_active: boolean;
}

export interface Permission {
  permission_id: number;
  permission_code: string;
  resource_type: string;
  action: string;
  required_discipline: string | null;
  sensitivity_level: string | null;
  note_type_restriction: string | null;
  care_context: string | null;
  is_active: boolean;
}

// An account (email + password). The person behind it is a Staff row.
export interface User {
  user_id: number;
  email: string;
  account_status: "active" | "disabled" | "locked" | string;
  is_active: boolean;
  created_at: string;
}

export interface Provider {
  provider_id: number;
  first_name: string;
  last_name: string;
  specialty: string | null;
  phone: string | null;
  email: string | null;
}

export interface Drug {
  drug_id: number;
  name: string;
  description: string | null;
}

export interface Patient {
  patient_id: number;
  mrn: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  preferred_name: string | null;
  date_of_birth: string;
  gender_at_birth: string | null;
  gender_identity: string;
  pronouns: string;
  status: string;
  provider_id: number | null;
  provider: Provider | null;
  drugs: Drug[];
}

// A person: staff member or student, with their role, discipline, and department.
export interface Staff {
  staffid: number;
  user_id: number | null; // null when the person has no account
  first_name: string;
  middle_name: string | null;
  last_name: string;
  role_id: number;
  role_name: RoleName | string | null;
  discipline_id: number | null;
  discipline_name: string | null;
  department_id: number | null;
  department_name: string | null;
  student: boolean; // role_name === "STUDENT"
  admin: boolean; // role_name === "ADMIN"
}

// What the app needs to create or edit a person.
export interface StaffInput {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  role_id: number;
  discipline_id: number | null;
  department_id: number | null;
}

// Who is signed in and what they may do.
export interface LoginResponse {
  username: string;
  staffid: number | null;
  first_name: string | null;
  last_name: string | null;
  role: RoleName | null;
  role_display_name: string | null;
  department_id: number | null;
  department_code: string | null;
  department_name: string | null;
  discipline_id: number | null;
  discipline_name: string | null;
  permissions: string[]; // e.g. "patient.read", "note.read.general"
  student: boolean;
  admin: boolean;
}

export interface MedicalHistory {
  medical_history_id: number;
  patient_id: number;
  condition: string;
  diagnosis_date: string | null;
  notes: string | null;
}

export interface FamilyHistory {
  family_history_id: number;
  patient_id: number;
  relationship: string;
  condition: string;
  notes: string | null;
}

export interface Room {
  room_id: number;
  room_number: number;
  unit: string;
  status: string;
}

export interface Appointment {
  appointment_id: number;
  patient_id: number;
  provider_id: number;
  appointment_datetime: string;
  location: string;
  status: string;
}

export interface BillingCharge {
  charge_id: number;
  patient_id: number;
  charge_summary: string;
  charge_amount: string;
}

export type InsurancePriority = "primary" | "secondary";

export type InsuranceVerificationStatus =
  | "unverified"
  | "verified_active"
  | "verified_inactive"
  | "unable_to_verify";

export interface PatientInsurance {
  insurance_id: number;
  patient_id: number;
  insurance_company: string;
  member_id: string;
  group_number: string | null;
  policyholder_name: string;
  policyholder_date_of_birth: string | null;
  insurance_priority: InsurancePriority;
  coverage_start_date: string | null;
  coverage_end_date: string | null;
  verification_status: InsuranceVerificationStatus;
}

export type EncounterStatus = "not_started" | "in_progress" | "submitted" | "signed";  //for use with Assignment interface

export interface Assignment {
  assignment_id: number;
  case_id: number;
  encounter_status: EncounterStatus;
  course_id: number | null;
  course: string | null; // label, e.g. "NURS 3310"
  due_date: string | null;
  assignment_type?: "graded" | "practice";
  assigned_to: number;
  assigned_by: number;
  encounter_id: number | null; // set once the student starts the case
  patient_name: string | null; // "Last name, First name"
  chief_complaint: string | null;
  feedback: string | null; // instructor feedback; visible to student only after submitting
  feedback_updated_at: string | null; // instructor feedback logging
}

// Rubric markers instructors set on a case.
export type RubricCategory = "diagnosis" | "medication_conflict" | "screening" | "trap" | "other";

// One rubric line in an assignment's grade
export interface GradeItem {
  rubric_item_id: number;
  category: RubricCategory;
  label: string;
  points: number;
  guidance: string | null; // Instructor-only; always null for students
  points_awarded: number | null;
  comment: string | null;
}

// Assignment's rubric and score
export interface AssignmentGrade {
  assignment_id: number;
  released: boolean;
  items: GradeItem[];
  total_points: number | null;
  points_awarded: number | null;
  scored_count: number | null;
}

export interface Case {
  case_id: number;
  patient_id: number;
  chief_complaint: string;
  narrative: string | null;
  created_by_staff_id: number;
  created_at: string;
  patient: Patient | null;
}
export type CourseTerm = "Fall" | "Spring" | "Summer";

export interface Course {
  course_id: number;
  subject_code: string;
  course_number: string;
  title: string;
  term: CourseTerm;
  term_year: number;
  department_id: number;
  department_name: string | null;
  is_active: boolean;
  created_at: string;
  short_label: string; // e.g. "PHAR 5310" (computed by the backend)
  label: string; // e.g. "PHAR 5310 – Pharmacotherapy I (Fall 2026)"
}
