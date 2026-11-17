import type { Room } from "../types";
import { apiFetch } from "./client";

// Shape of the data sent to the backend when creating a room.
export interface CreateRoomInput {
  room_number: number;
  unit: string;
  status: string;
}

// One function per backend endpoint under /rooms. Each just calls apiFetch
// with the right path/method - no business logic lives here.
// Patients are put in rooms from the help desk queue (api/helpDesk.ts).
export const roomsApi = {
  list: () => apiFetch<Room[]>("/rooms"),
  create: (input: CreateRoomInput) =>
    apiFetch<Room>("/rooms", { method: "POST", body: JSON.stringify(input) }),
  remove: (roomId: number) => apiFetch<void>(`/rooms/${roomId}`, { method: "DELETE" }),
};