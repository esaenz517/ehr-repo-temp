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