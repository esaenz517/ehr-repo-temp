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