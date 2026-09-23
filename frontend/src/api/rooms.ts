import type { Room } from "../types";
import { apiFetch } from "./client";

export interface CreateRoomInput {
  room_number: number;
  unit: string;
  status: string;
}

export const roomsApi = {
  list: () => apiFetch<Room[]>("/rooms"),
  create: (input: CreateRoomInput) =>
    apiFetch<Room>("/rooms", { method: "POST", body: JSON.stringify(input) }),
  remove: (roomId: number) => apiFetch<void>(`/rooms/${roomId}`, { method: "DELETE" }),
};