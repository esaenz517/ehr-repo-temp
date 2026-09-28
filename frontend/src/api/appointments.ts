import type { Appointment } from "../types";
import { apiFetch } from "./client";

export interface AppointmentInput {
  appointment_datetime: string;
  location: string;
  status: string;
}

export const appointmentsApi = {
  list: (patientId: number) =>
    apiFetch<Appointment[]>(`/patients/${patientId}/appointments`),

  create: (patientId: number, input: AppointmentInput) =>
    apiFetch<Appointment>(`/patients/${patientId}/appointments`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (
    patientId: number,
    appointmentId: number,
    input: AppointmentInput
  ) =>
    apiFetch<Appointment>(
      `/patients/${patientId}/appointments/${appointmentId}`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      }
    ),

  remove: (patientId: number, appointmentId: number) =>
    apiFetch<void>(
      `/patients/${patientId}/appointments/${appointmentId}`,
      { method: "DELETE" }
    ),
};