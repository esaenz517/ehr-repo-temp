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
  date_of_birth: string;
  gender: string | null;
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

export interface Room {
  room_id: number;
  room_number: number;
  unit: string;
  status: string;
}