import { useCallback, useEffect, useState } from "react";
import { CreateRoomInput, roomsApi } from "../api/rooms";
import type { Room } from "../types";

// All the state + actions RoomsPage needs. Keeps data-fetching out of the components.
// Patients are put in rooms from the front desk (hooks/useFrontDesk.ts), not here.
export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetches the rooms (with who is in each). Called once on mount, and again
  // after every create/delete so the UI always reflects the latest backend data.
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

  // Load once when the hook is first used.
  useEffect(() => {
    load();
  }, [load]);

  const create = async (input: CreateRoomInput) => {
    try {
      await roomsApi.create(input);
      await load(); // refresh so the new room shows up in the list
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
