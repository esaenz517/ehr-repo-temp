import type { Item } from "../types";
import { apiFetch } from "./client";

export interface CreateItemInput {
  name: string;
  description: string | null;
}

export const itemsApi = {
  list: () => apiFetch<Item[]>("/items"),
  create: (input: CreateItemInput) =>
    apiFetch<Item>("/items", { method: "POST", body: JSON.stringify(input) }),
  remove: (id: number) => apiFetch<void>(`/items/${id}`, { method: "DELETE" }),
};
