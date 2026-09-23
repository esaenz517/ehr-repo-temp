import { useCallback, useEffect, useState } from "react";
import { CreateRoomInput, roomsApi } from "../api/rooms";
import type { Room } from "../types";

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRooms(await roomsApi.list());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (input: CreateRoomInput) => {
    try {
      await roomsApi.create(input);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    }
  };

  const remove = async (roomId: number) => {
    try {
      await roomsApi.remove(roomId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete room");
    }
  };

  return { rooms, loading, error, create, remove };
}
