import { useCallback, useEffect, useState } from "react";
import { CreateRoomInput, roomsApi } from "../api/rooms";
import type { Patient, Room } from "../types";

// All the state + actions RoomsPage needs. Keeps data-fetching out of the components.
export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  // The patient dropdown options for assigning - kept alongside rooms since
  // it needs to refresh every time rooms do (e.g. after an assign/unassign).
  const [availablePatients, setAvailablePatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetches rooms and available patients together and stores them in state.
  // Called once on mount, and again after every create/delete/assign/unassign
  // so the UI always reflects the latest backend data.
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [roomsData, patientsData] = await Promise.all([
        roomsApi.list(),
        roomsApi.availablePatients(),
      ]);
      setRooms(roomsData);
      setAvailablePatients(patientsData);
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

  // Assign a patient to a room, then reload so the room's status (now
  // "occupied") and the available-patients list (now missing this patient)
  // both update.
  const assign = async (roomId: number, patientId: number) => {
    try {
      await roomsApi.assign(roomId, patientId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign patient");
    }
  };

  // Discharge whoever's in a room, then reload so it flips back to
  // "available" and its patient reappears in the dropdown.
  const unassign = async (roomId: number) => {
    try {
      await roomsApi.unassign(roomId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unassign patient");
    }
  };

  return { rooms, availablePatients, loading, error, create, remove, assign, unassign };
}
