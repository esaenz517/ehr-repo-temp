import type { Patient, Room } from "../types";
import { apiFetch } from "./client";

// Shape of the data sent to the backend when creating a room.
export interface CreateRoomInput {
  room_number: number;
  unit: string;
  status: string;
}

// One function per backend endpoint under /rooms. Each just calls apiFetch
// with the right path/method - no business logic lives here.
export const roomsApi = {
  list: () => apiFetch<Room[]>("/rooms"),
  create: (input: CreateRoomInput) =>
    apiFetch<Room>("/rooms", { method: "POST", body: JSON.stringify(input) }),
  remove: (roomId: number) => apiFetch<void>(`/rooms/${roomId}`, { method: "DELETE" }),
  // Patients who are NOT currently assigned to a room - used to populate the
  // "assign a patient" dropdown.
  availablePatients: () => apiFetch<Patient[]>("/rooms/available-patient"),
  // Puts a patient in this room and flips the room's status to "occupied" (done on the backend).
  assign: (roomId: number, patientId: number) =>
    apiFetch<Room>(`/rooms/${roomId}/assign/`, {
      method: "POST",
      body: JSON.stringify({ patient_id: patientId }),
    }),
  // Discharges whoever is currently in this room and flips it back to "available".
  unassign: (roomId: number) =>
    apiFetch<Room>(`/rooms/${roomId}/unassign/`, { method: "POST" }),
};