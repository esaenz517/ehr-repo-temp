import type { CheckIn, DeskAppointment } from "../types";
import { apiFetch } from "./client";

// One function per backend endpoint under /help-desk (backend routers/check_ins.py).
export const helpDeskApi = {
  // Scheduled appointments on `day` ("YYYY-MM-DD", the browser's local date) not checked in yet
  appointments: (day: string) => apiFetch<DeskAppointment[]>(`/help-desk/appointments?day=${day}`),
  // Everyone checked in and not yet discharged
  queue: () => apiFetch<CheckIn[]>("/help-desk/queue"),
  // appointmentId is null for a walk-in or a patient just registered at the desk
  checkIn: (patientId: number, appointmentId: number | null = null) =>
    apiFetch<CheckIn>("/help-desk/check-ins", {
      method: "POST",
      body: JSON.stringify({ patient_id: patientId, appointment_id: appointmentId }),
    }),
  assignRoom: (checkInId: number, roomId: number) =>
    apiFetch<CheckIn>(`/help-desk/check-ins/${checkInId}/room`, {
      method: "POST",
      body: JSON.stringify({ room_id: roomId }),
    }),
  discharge: (checkInId: number) =>
    apiFetch<CheckIn>(`/help-desk/check-ins/${checkInId}/discharge`, { method: "POST" }),
  cancel: (checkInId: number) =>
    apiFetch<CheckIn>(`/help-desk/check-ins/${checkInId}/cancel`, { method: "POST" }),
};
