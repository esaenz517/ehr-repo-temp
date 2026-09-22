export interface Item {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
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
