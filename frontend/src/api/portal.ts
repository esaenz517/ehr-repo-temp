// Patient portal API: the signed-in patient's own record. No patient id is ever
// sent; the backend takes it from the session cookie.
import type {
  PortalAllergy,
  PortalAppointment,
  PortalBilling,
  PortalFamilyHistory,
  PortalInsurance,
  PortalLabResult,
  PortalMedicalHistory,
  PortalMedication,
  PortalProfile,
  PortalVital,
} from "../types";
import { apiFetch } from "./client";

export const portalApi = {
  profile: () => apiFetch<PortalProfile>("/portal/me"),
  appointments: () => apiFetch<PortalAppointment[]>("/portal/appointments"),
  billing: () => apiFetch<PortalBilling>("/portal/billing"),
  insurance: () => apiFetch<PortalInsurance[]>("/portal/insurance"),
  medicalHistory: () => apiFetch<PortalMedicalHistory[]>("/portal/medical-history"),
  familyHistory: () => apiFetch<PortalFamilyHistory[]>("/portal/family-history"),
  medications: () => apiFetch<PortalMedication[]>("/portal/medications"),
  allergies: () => apiFetch<PortalAllergy[]>("/portal/allergies"),
  vitals: () => apiFetch<PortalVital[]>("/portal/vitals"),
  labResults: () => apiFetch<PortalLabResult[]>("/portal/lab-results"),
};
