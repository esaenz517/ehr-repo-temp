export interface Role {
  role_id: number;
  role_name: string;
  display_name: string;
  discipline: string | null;
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

export interface User {
  user_id: number;
  name: string;
  email: string;
  discipline: string | null;
  account_status: string;
  created_at: string;
}

export interface Item {
  id: number;
  name: string;
  description: string | null;
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

export interface Staff {
  staffid: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  specialization: string;
  student: boolean;
  admin: boolean;
}

export interface LoginResponse {
  username: string;
  staffid: number;
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

export type EncounterStatus = "not_started" | "in_progress" | "submitted" | "signed";  //for use with Assignment interface

export interface Assignment {
  assignment_id: number;
  case_id: number;
  encounter_status: EncounterStatus;
  course: string | null;
  due_date: string | null;
  assigned_to: number;
  assigned_by: number;
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